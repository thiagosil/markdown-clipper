// Script to generate Markdown Clipper icons
// Run: npm install canvas && node scripts/generate-icons.js

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const outputDir = path.join(__dirname, '..', 'src', 'icons');

function drawMarkdownIcon(ctx, size) {
	const padding = size * 0.1;
	const innerSize = size - padding * 2;

	// Background - rounded rectangle with blue gradient
	const radius = size * 0.15;
	ctx.fillStyle = '#3B82F6'; // Blue color

	ctx.beginPath();
	ctx.roundRect(padding, padding, innerSize, innerSize, radius);
	ctx.fill();

	// Draw "M" and down arrow in white
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// For small icons, just draw M
	if (size <= 16) {
		ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
		ctx.fillText('M', size / 2, size / 2);
		return;
	}

	// For larger icons, draw the M↓ markdown symbol
	const centerX = size / 2;
	const centerY = size / 2;

	// Draw M
	ctx.font = `bold ${size * 0.45}px Arial, sans-serif`;
	ctx.fillText('M', centerX, centerY - size * 0.08);

	// Draw down arrow below M
	const arrowY = centerY + size * 0.22;
	const arrowWidth = size * 0.2;
	const arrowHeight = size * 0.12;

	ctx.beginPath();
	ctx.moveTo(centerX - arrowWidth / 2, arrowY - arrowHeight / 2);
	ctx.lineTo(centerX + arrowWidth / 2, arrowY - arrowHeight / 2);
	ctx.lineTo(centerX, arrowY + arrowHeight / 2);
	ctx.closePath();
	ctx.fill();
}

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

for (const size of sizes) {
	const canvas = createCanvas(size, size);
	const ctx = canvas.getContext('2d');

	// Clear with transparency
	ctx.clearRect(0, 0, size, size);

	drawMarkdownIcon(ctx, size);

	const buffer = canvas.toBuffer('image/png');
	const outputPath = path.join(outputDir, `icon${size}.png`);
	fs.writeFileSync(outputPath, buffer);
	console.log(`Generated ${outputPath}`);
}

console.log('Done! Icons generated successfully.');
