import { escapeDoubleQuotes, sanitizeFileName } from './string-utils';
import { Property } from '../types/types';
import { generalSettings } from './storage-utils';

const DB_NAME = 'MarkdownClipperDB';
const DB_VERSION = 1;
const FOLDER_STORE = 'folderHandles';

// Open IndexedDB connection
function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(FOLDER_STORE)) {
				db.createObjectStore(FOLDER_STORE, { keyPath: 'name' });
			}
		};
	});
}

// Store a folder handle in IndexedDB
export async function storeFolderHandle(name: string, handle: FileSystemDirectoryHandle): Promise<void> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([FOLDER_STORE], 'readwrite');
		const store = transaction.objectStore(FOLDER_STORE);
		const request = store.put({ name, handle });

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();

		transaction.oncomplete = () => db.close();
	});
}

// Get a folder handle from IndexedDB
export async function getFolderHandle(name: string): Promise<FileSystemDirectoryHandle | null> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([FOLDER_STORE], 'readonly');
		const store = transaction.objectStore(FOLDER_STORE);
		const request = store.get(name);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const result = request.result;
			resolve(result ? result.handle : null);
		};

		transaction.oncomplete = () => db.close();
	});
}

// Remove a folder handle from IndexedDB
export async function removeFolderHandle(name: string): Promise<void> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([FOLDER_STORE], 'readwrite');
		const store = transaction.objectStore(FOLDER_STORE);
		const request = store.delete(name);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();

		transaction.oncomplete = () => db.close();
	});
}

// Get all folder handles from IndexedDB
export async function getAllFolderHandles(): Promise<Map<string, FileSystemDirectoryHandle>> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([FOLDER_STORE], 'readonly');
		const store = transaction.objectStore(FOLDER_STORE);
		const request = store.getAll();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const results = request.result;
			const handleMap = new Map<string, FileSystemDirectoryHandle>();
			for (const item of results) {
				handleMap.set(item.name, item.handle);
			}
			resolve(handleMap);
		};

		transaction.oncomplete = () => db.close();
	});
}

// Request folder access from user using File System Access API
export async function selectFolder(): Promise<{ handle: FileSystemDirectoryHandle; path: string } | null> {
	try {
		// Check if File System Access API is supported
		if (!('showDirectoryPicker' in window)) {
			throw new Error('File System Access API is not supported in this browser. Please use Chrome or Edge.');
		}

		const handle = await (window as any).showDirectoryPicker({
			mode: 'readwrite'
		});

		// Get the path for display (folder name)
		const path = handle.name;

		return { handle, path };
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			// User cancelled the picker
			return null;
		}
		throw error;
	}
}

// Verify if we still have permission to access a folder
export async function verifyFolderAccess(handle: FileSystemDirectoryHandle): Promise<boolean> {
	try {
		// Try to get permission status
		const permission = await (handle as any).queryPermission({ mode: 'readwrite' });
		if (permission === 'granted') {
			return true;
		}

		// If not granted, try to request permission
		const newPermission = await (handle as any).requestPermission({ mode: 'readwrite' });
		return newPermission === 'granted';
	} catch (error) {
		console.error('Error verifying folder access:', error);
		return false;
	}
}

// Get or create a subfolder within a directory
async function getOrCreateSubfolder(
	parentHandle: FileSystemDirectoryHandle,
	subfolderPath: string
): Promise<FileSystemDirectoryHandle> {
	if (!subfolderPath || subfolderPath === '/' || subfolderPath === '.') {
		return parentHandle;
	}

	// Split path and navigate/create each directory
	const parts = subfolderPath.split('/').filter(p => p && p !== '.');
	let currentHandle = parentHandle;

	for (const part of parts) {
		currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
	}

	return currentHandle;
}

// Save markdown content to a folder
export async function saveToFolder(
	content: string,
	fileName: string,
	folderHandle: FileSystemDirectoryHandle,
	subfolder?: string
): Promise<void> {
	// Verify we have permission
	const hasAccess = await verifyFolderAccess(folderHandle);
	if (!hasAccess) {
		throw new Error('Permission denied. Please re-select the folder.');
	}

	// Get the target directory (creating subfolders if needed)
	const targetDir = subfolder
		? await getOrCreateSubfolder(folderHandle, subfolder)
		: folderHandle;

	// Sanitize the filename
	let sanitizedFileName = sanitizeFileName(fileName);
	if (!sanitizedFileName.toLowerCase().endsWith('.md')) {
		sanitizedFileName += '.md';
	}

	// Create or overwrite the file
	const fileHandle = await targetDir.getFileHandle(sanitizedFileName, { create: true });
	const writable = await fileHandle.createWritable();

	try {
		await writable.write(content);
	} finally {
		await writable.close();
	}
}

// Generate YAML frontmatter from properties
export async function generateFrontmatter(properties: Property[]): Promise<string> {
	let frontmatter = '---\n';
	for (const property of properties) {
		// Wrap property name in quotes if it contains YAML-ambiguous characters
		const needsQuotes = /[:\s\{\}\[\],&*#?|<>=!%@\\-]/.test(property.name) || /^[\d]/.test(property.name) || /^(true|false|null|yes|no|on|off)$/i.test(property.name.trim());
		const propertyKey = needsQuotes ? (property.name.includes('"') ? `'${property.name.replace(/'/g, "''")}'` : `"${property.name}"`) : property.name;
		frontmatter += `${propertyKey}:`;

		const propertyType = generalSettings.propertyTypes.find(p => p.name === property.name)?.type || 'text';

		switch (propertyType) {
			case 'multitext':
				let items: string[];
				if (property.value.trim().startsWith('["') && property.value.trim().endsWith('"]')) {
					try {
						items = JSON.parse(property.value);
					} catch (e) {
						// If parsing fails, fall back to splitting by comma
						items = property.value.split(',').map(item => item.trim());
					}
				} else {
					// Split by comma, but keep wikilinks intact
					items = property.value.split(/,(?![^\[]*\]\])/).map(item => item.trim());
				}
				items = items.filter(item => item !== '');
				if (items.length > 0) {
					frontmatter += '\n';
					items.forEach(item => {
						frontmatter += `  - "${escapeDoubleQuotes(item)}"\n`;
					});
				} else {
					frontmatter += '\n';
				}
				break;
			case 'number':
				const numericValue = property.value.replace(/[^\d.-]/g, '');
				frontmatter += numericValue ? ` ${parseFloat(numericValue)}\n` : '\n';
				break;
			case 'checkbox':
				const isChecked = typeof property.value === 'boolean' ? property.value : property.value === 'true';
				frontmatter += ` ${isChecked}\n`;
				break;
			case 'date':
			case 'datetime':
				if (property.value.trim() !== '') {
					frontmatter += ` ${property.value}\n`;
				} else {
					frontmatter += '\n';
				}
				break;
			default: // Text
				frontmatter += property.value.trim() !== '' ? ` "${escapeDoubleQuotes(property.value)}"\n` : '\n';
		}
	}
	frontmatter += '---\n';

	// Check if the frontmatter is empty
	if (frontmatter.trim() === '---\n---') {
		return '';
	}

	return frontmatter;
}

// Main save function - replaces saveToObsidian
export async function saveMarkdown(
	fileContent: string,
	noteName: string,
	path: string,
	folderName: string
): Promise<void> {
	// Get the folder handle from IndexedDB
	const folderHandle = await getFolderHandle(folderName);

	if (!folderHandle) {
		throw new Error(`Folder "${folderName}" not found. Please re-add it in settings.`);
	}

	// Save the file
	await saveToFolder(fileContent, noteName, folderHandle, path);
}
