// Builds the color-picker palette for the Clay page: only Pebble colors with enough
// contrast against the current (pure black or white) background, using the same
// sunlight-corrected values Clay draws the swatches with.
var SUNLIGHT = {
  '000000': '000000', '000055': '001e41', '0000aa': '004387', '0000ff': '0068ca',
  '005500': '2b4a2c', '005555': '27514f', '0055aa': '16638d', '0055ff': '007dce',
  '00aa00': '5e9860', '00aa55': '5c9b72', '00aaaa': '57a5a2', '00aaff': '4cb4db',
  '00ff00': '8ee391', '00ff55': '8ee69e', '00ffaa': '8aebc0', '00ffff': '84f5f1',
  '550000': '4a161b', '550055': '482748', '5500aa': '40488a', '5500ff': '2f6bcc',
  '555500': '564e36', '555555': '545454', '5555aa': '4f6790', '5555ff': '4180d0',
  '55aa00': '759a64', '55aa55': '759d76', '55aaaa': '71a6a4', '55aaff': '69b5dd',
  '55ff00': '9ee594', '55ff55': '9de7a0', '55ffaa': '9becc2', '55ffff': '95f6f2',
  'aa0000': '99353f', 'aa0055': '983e5a', 'aa00aa': '955694', 'aa00ff': '8f74d2',
  'aa5500': '9d5b4d', 'aa5555': '9d6064', 'aa55aa': '9a7099', 'aa55ff': '9587d5',
  'aaaa00': 'afa072', 'aaaa55': 'aea382', 'aaaaaa': 'ababab', 'ffffff': 'ffffff',
  'aaaaff': 'a7bae2', 'aaff00': 'c9e89d', 'aaff55': 'c9eaa7', 'aaffaa': 'c7f0c8',
  'aaffff': 'c3f9f7', 'ff0000': 'e35462', 'ff0055': 'e25874', 'ff00aa': 'e16aa3',
  'ff00ff': 'de83dc', 'ff5500': 'e66e6b', 'ff5555': 'e6727c', 'ff55aa': 'e37fa7',
  'ff55ff': 'e194df', 'ffaa00': 'f1aa86', 'ffaa55': 'f1ad93', 'ffaaaa': 'efb5b8',
  'ffaaff': 'ecc3eb', 'ffff00': 'ffeeab', 'ffff55': 'fff1b5', 'ffffaa': 'fff6d3'
};

function hex6(value) {
  var s = (typeof value === 'number' ? value : parseInt(String(value).replace(/^(#|0x)/i, ''), 16)).toString(16);
  while (s.length < 6) { s = '0' + s; }
  return s.toLowerCase();
}

function luminance(hex) {
  var c = [0, 2, 4].map(function (i) {
    var v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

// WCAG contrast ratio of two Pebble colors (hex strings or numbers).
function contrast(a, b) {
  var la = luminance(SUNLIGHT[hex6(a)]);
  var lb = luminance(SUNLIGHT[hex6(b)]);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function hsl(hex) {
  var r = parseInt(hex.substr(0, 2), 16) / 255;
  var g = parseInt(hex.substr(2, 2), 16) / 255;
  var b = parseInt(hex.substr(4, 2), 16) / 255;
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var d = max - min;
  var h = 0;
  if (d) {
    if (max === r) { h = ((g - b) / d + 6) % 6; }
    else if (max === g) { h = (b - r) / d + 2; }
    else { h = (r - g) / d + 4; }
  }
  return { h: h * 60, l: (max + min) / 2, gray: d === 0 };
}

var THRESHOLD = 4.5;
var COLUMNS = 8;

// dark: true for the black background. extra: current saved values to keep even if
// they fail the filter (appended after the filtered colors). Returns rows of hex.
function buildPalette(dark, extra) {
  var bg = dark ? '000000' : 'ffffff';
  var all = Object.keys(SUNLIGHT).filter(function (hex) {
    return hex !== '000000' && hex !== 'ffffff' && contrast(hex, bg) >= THRESHOLD;
  });
  var grays = all.filter(function (h) { return hsl(h).gray; });
  var colors = all.filter(function (h) { return !hsl(h).gray; });
  grays.sort(function (a, b) { return hsl(a).l - hsl(b).l; });
  colors.sort(function (a, b) {
    var x = hsl(a), y = hsl(b);
    return x.h - y.h || x.l - y.l;
  });
  var list = ['000000', 'ffffff'].concat(grays, colors);
  (extra || []).forEach(function (value) {
    var hex;
    try { hex = hex6(value); } catch (e) { return; }
    if (SUNLIGHT[hex] && list.indexOf(hex) === -1) { list.push(hex); }
  });
  var rows = [];
  for (var i = 0; i < list.length; i += COLUMNS) { rows.push(list.slice(i, i + COLUMNS)); }
  return rows;
}

module.exports = {
  buildPalette: buildPalette,
  contrast: contrast,
  hex6: hex6,
  THRESHOLD: THRESHOLD
};
