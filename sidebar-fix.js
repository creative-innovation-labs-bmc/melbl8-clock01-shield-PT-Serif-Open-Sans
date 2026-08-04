// QC fix for the vertical location, date and weekday text.
// The initial font replacement measured the text while the 50 px footer size
// was still active, which could incorrectly shrink the side information.

window.drawLayout = function drawLayout(time, sidebarText) {
  const zoneW = width / 4;
  const dividerLerp = map(sin(frameCount * 0.008), -1, 1, 0, 0.3);
  const dividerR = lerp(255, 78, dividerLerp);
  const dividerG = lerp(255, 88, dividerLerp);
  const dividerB = lerp(255, 89, dividerLerp);

  for (let i = 0; i < 4; i++) {
    const startX = i * zoneW;

    textFont(footerFont);
    fill(255);
    noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(scaled(50));
    text(time, startX + scaled(50), height - scaled(50));

    push();
    textFont(sidebarFont);
    fill(SIDEBAR);
    translate(startX + zoneW - scaled(60), height - scaled(50));
    rotate(-HALF_PI);
    textAlign(LEFT, CENTER);

    let sidebarSize = scaled(24);
    const availableLength = height - scaled(100);

    // Set the intended side-text size before measuring it.
    textSize(sidebarSize);
    const measuredLength = Math.max(1, textWidth(sidebarText));

    // Preserve the original 24 px size unless the location string truly needs fitting.
    if (measuredLength > availableLength) {
      sidebarSize *= availableLength / measuredLength;
      textSize(sidebarSize);
    }

    text(sidebarText, 0, 0);
    pop();

    stroke(dividerR, dividerG, dividerB);
    strokeWeight(scaled(2.0));
    line((i + 1) * zoneW, 0, (i + 1) * zoneW, height);
  }
};
