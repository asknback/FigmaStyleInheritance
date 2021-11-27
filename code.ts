
// Look at all styles' descriptions to find a matching source style and return if found
function getSourceForStyle(style, styles) {
  for (const currentStyle of styles) {
    if (style.description === currentStyle.name) return currentStyle;
  }
  return null;
}

// Form pairs
function getReceiverSourcePairs(styles) {
  return styles.map((style) => ({
    receiver: style,
    source: getSourceForStyle(style, styles),
  }));
}

// Main plugin logic
// figma.showUI(__html__);
figma.showUI(__html__, { width: 480, height: 400, title: "Figma Style Inheritance" }); 

const styles = figma.getLocalPaintStyles();
// Call the helper function to form pairs
const receiverSourcePairs = getReceiverSourcePairs(styles);

// Transform data into the shape we want before sending it to the UI
const receiverSourceData = receiverSourcePairs.map((pair) => ({
  receiver: {
    name: pair.receiver.name,
    id: pair.receiver.id,
  },
  source: {
    // Some styles don't have a source, so we need to check
    name: pair.source ? pair.source.name : "",
  },
}));

// Debug
console.log(receiverSourceData);

// Send to UI
figma.ui.postMessage({
  type: "render",
  receiverSourceData,
});

figma.ui.onmessage = (msg) => {
  if (msg.type == "update-source") {
    const receiverStyle = figma.getStyleById(msg.receiverId) as PaintStyle;
    // We can only find the source style by name
    const sourceStyle = styles.find(
      (style) => style.name === msg.newSourceName
    );
    // return early if one of the styles is not found
    if (!(receiverStyle && sourceStyle)) return;

    // Replace description and properties for the receiver
    receiverStyle.description = msg.newSourceName;
    receiverStyle.paints = sourceStyle.paints;
    console.log("receiverStyle:", receiverStyle);

    // Show a success message in the Figma interface
    figma.notify(`New source style: ${msg.newSourceName}`);
  }
}

// Set Secondary to Black
//  Iterate all colors
//    Is colorX using Secondary
//      no? End yes? Set colorX to Secondary again
//         Iterate all colors
//           is colorY using colorX
//             no? End. yes? continue the same
