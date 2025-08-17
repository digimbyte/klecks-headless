# Klecks Headless

A headless version of Klecks that provides full painting functionality through managers while only rendering the canvas.

## Overview

Klecks Headless removes all UI toolspace and widgets but preserves **ALL** functionality through programmatic manager APIs. This allows:

- **Canvas-only rendering** - Just the painting canvas, no UI chrome
- **Full feature access** - Text, brushes, layers, filters, shapes, gradients, etc.
- **Manager-based API** - Clean interfaces for all operations
- **Preview/finalize workflows** - Especially for text operations

## Quick Start

### Building

```bash
# Generate language files (required)
npm run lang:build

# Build the headless version
npm run build:headless
```

This creates `/dist/headless.js` and `/dist/headless.css`.

### Basic Usage

```javascript
// Create headless Klecks instance
const klecks = await KlecksHeadless.createKlecks({
    width: 800,
    height: 600,
    onUpdate: () => console.log('Canvas updated')
});

// Add canvas to your DOM
document.getElementById('canvas-container').appendChild(klecks.getCanvasElement());
```

## API Reference

### Text Manager

The text manager provides full text functionality with preview/finalize workflow:

```javascript
// Create text instance
const textTool = klecks.text.create({
    text: "Hello World!",
    x: 100, y: 100,
    size: 24,
    font: 'Arial',
    fillColor: { r: 0, g: 0, b: 0, a: 1 }
});

// Modify before finalizing
textTool.move(50, 0);              // Move by offset
textTool.setPosition(200, 150);    // Set absolute position
textTool.changeFont('Comic Sans');  // Change font
textTool.changeSize(32);           // Change size
textTool.rotate(Math.PI / 4);      // Rotate (radians)
textTool.setBold(true);            // Bold/italic
textTool.setItalic(true);
textTool.setAlign('center');       // left, center, right
textTool.setLineHeight(1.2);       // Line height (em)
textTool.setLetterSpacing(2);      // Letter spacing (px)

// Colors
textTool.setFillColor({ r: 255, g: 0, b: 0, a: 1 });
textTool.setStrokeColor({ r: 0, g: 0, b: 255, a: 1 }, 3); // color, width
textTool.removeFill();
textTool.removeStroke();

// Preview and finalize
const previewCanvas = textTool.getPreviewCanvas(); // Get preview
const bounds = textTool.getBounds(); // Get text bounds
textTool.finalize(); // Commit to layer
// or textTool.cancel(); // Discard
```

### Brush Manager

```javascript
// Configure brush
klecks.brush.setBrush('penBrush');        // Set brush type
klecks.brush.setSize(15);                 // Set size
klecks.brush.setOpacity(0.8);             // Set opacity (0-1)  
klecks.brush.setColor({ r: 255, g: 0, b: 0 }); // Set color

// Drawing operations
klecks.brush.startStroke(100, 100, 1.0);  // x, y, pressure
klecks.brush.addToStroke(150, 120, 0.8);  // Continue stroke
klecks.brush.endStroke();                 // Finish stroke

// Convenience methods
klecks.brush.drawLine(0, 0, 100, 100);    // Draw line
klecks.brush.drawStroke([                 // Draw path
    { x: 0, y: 0 },
    { x: 50, y: 25 },
    { x: 100, y: 0 }
]);

// Available brushes
const brushes = klecks.brush.getAvailableBrushes();
console.log(brushes); // ['penBrush', 'blendBrush', 'sketchyBrush', ...]
```

### Layer Manager

```javascript
// Create and manage layers
const layerIndex = klecks.layers.create('Text Layer'); // Create layer
klecks.layers.setActive(layerIndex);                   // Set active
klecks.layers.duplicate(0);                            // Duplicate layer
klecks.layers.delete(layerIndex);                      // Delete layer
klecks.layers.move(0, 2);                             // Reorder layers

// Layer properties
klecks.layers.setVisible(layerIndex, true);           // Show/hide
klecks.layers.setOpacity(layerIndex, 0.7);            // Set opacity
klecks.layers.setMixMode(layerIndex, 'multiply');     // Set blend mode
klecks.layers.rename(layerIndex, 'New Name');         // Rename

// Layer operations
klecks.layers.clear(layerIndex);                      // Clear layer
klecks.layers.fill(layerIndex, '#ff0000');            // Fill with color
klecks.layers.mergeDown(layerIndex);                  // Merge down
klecks.layers.flatten();                              // Flatten all

// Layer info
const layerInfo = klecks.layers.getInfo(layerIndex);
const allLayers = klecks.layers.getAllInfo();
const layerCount = klecks.layers.getCount();
const activeIndex = klecks.layers.getActiveIndex();
```

### Shape Manager (Stub - To Be Implemented)

```javascript
klecks.shapes.drawRectangle(x, y, width, height, options);
klecks.shapes.drawEllipse(x, y, width, height, options);
klecks.shapes.drawLine(x1, y1, x2, y2, options);
```

### Filter Manager (Stub - To Be Implemented)

```javascript
klecks.filters.applyFilter('blur', { radius: 5 });
```

### Gradient Manager (Stub - To Be Implemented)

```javascript
klecks.gradients.createLinearGradient(x1, y1, x2, y2, colors);
klecks.gradients.createRadialGradient(x, y, radius, colors);
```

### Project Manager (Stub - To Be Implemented)

```javascript
klecks.project.loadProject(projectData);
klecks.project.saveProject();
const pngBlob = klecks.project.exportToPNG();
const psdBlob = klecks.project.exportToPSD();
```

### Core Operations

```javascript
// Canvas operations
klecks.resize(1200, 800);        // Resize canvas
klecks.clear();                  // Clear canvas

// Colors
klecks.setPrimaryColor({ r: 255, g: 0, b: 0 });
klecks.setSecondaryColor({ r: 0, g: 255, b: 0 });
const primaryColor = klecks.getPrimaryColor();

// Tools
klecks.setCurrentTool('text');   // Set current tool
const currentTool = klecks.getCurrentTool();

// History
const canUndo = klecks.canUndo();
const canRedo = klecks.canRedo();
klecks.undo();
klecks.redo();

// Access underlying instances
const klCanvas = klecks.getKlCanvas();   // KlCanvas instance
const history = klecks.getHistory();     // KlHistory instance
const canvasElement = klecks.getCanvasElement(); // DOM element
```

## Implementation Status

### ✅ Completed
- **KlecksManager** - Main orchestrator class
- **TextManager** - Full text functionality with preview/finalize workflow
- **BrushManager** - Drawing operations with pressure support
- **LayerManager** - Complete layer management
- **Build configuration** - Headless build target
- **Example usage** - Working demo and documentation

### 🚧 To Be Implemented (Currently Stubs)
- **FilterManager** - Image filters (blur, curves, etc.)
- **ShapeManager** - Shape drawing tools
- **GradientManager** - Gradient operations  
- **ProjectManager** - File operations and export
- **Enhanced BrushManager** - Full integration with BRUSHES system

### 💡 Future Enhancements
- WebGL filter support
- Advanced brush dynamics
- Selection tools
- Transform tools

## Architecture

The headless implementation follows this structure:

```
KlecksManager (main orchestrator)
├── TextManager (text.*)
├── BrushManager (brush.*)  
├── LayerManager (layers.*)
├── FilterManager (filters.*)
├── ShapeManager (shapes.*)
├── GradientManager (gradients.*)
├── ToolManager (tools.*)
└── ProjectManager (project.*)
```

Each manager wraps the existing Klecks functionality while providing a clean API interface. The underlying `KlCanvas` and `KlHistory` are shared across all managers.

## Development

To extend the headless implementation:

1. **Implement stub managers** - Replace stub implementations with full functionality from existing Klecks code
2. **Add new managers** - Create managers for additional functionality
3. **Extend TextManager** - Add more text formatting options
4. **Improve BrushManager** - Better integration with the BRUSHES system

The goal is to expose 100% of Klecks functionality through clean manager APIs while maintaining the canvas-only rendering approach.

## Example Projects

See `/examples/headless/basic-usage.html` for a complete working example with:
- Text creation and editing
- Layer management  
- Brush drawing
- Canvas operations
- Live preview functionality

## License

Same as Klecks - MIT License by bitbof.
