// Runs inside the Clay settings page (Clay serializes this function with
// toString(), so it must stay self-contained). Choosing a Color Preset fills the
// color pickers and toggles below it; the pickers are the real settings, and the
// watch never looks at the preset. index.js also calls this function with no
// Clay context to get presetValues() for migrating older saved settings.
module.exports = function () {
  // Pebble colors as RGB. Black and white both mean "text color" (white on a
  // dark background, black on a light one). Entries: [Dark, Light].
  var T = [0xFFFFFF, 0x000000];
  var PRESETS = {
    // id: { time, date, today, accent: [dark, light], icons, status }
    '0': { time: T, date: T, today: T, accent: T, icons: false, status: false },
    '1': { time: T, date: T, today: [0x0055FF, 0x0000FF], accent: T, icons: true, status: true },
    '2': { time: [0x55FFFF, 0x0000AA], date: [0x55AAFF, 0x0055AA], today: [0x55FFFF, 0x0000AA], accent: [0x55AAAA, 0x005555], icons: true, status: true },
    '3': { time: [0xAAFF55, 0x005500], date: [0xFFAA55, 0xAA5500], today: [0xAAFF55, 0x005500], accent: [0xAAAA55, 0x555500], icons: true, status: true },
    '4': { time: [0xFFAA00, 0xAA5500], date: [0xFFFF55, 0x550000], today: [0xFFAA00, 0xAA5500], accent: [0xFF5500, 0x555555], icons: true, status: true },
    '5': { time: [0xFF00FF, 0x5500AA], date: [0x00FF00, 0x005500], today: [0xFF00FF, 0xAA00AA], accent: [0xAA00FF, 0xAA00AA], icons: true, status: true }
  };

  // Color picker values for a preset in Dark (dark = true) or Light mode.
  function presetValues(id, dark) {
    var p = PRESETS[String(id)];
    if (!p) { return null; }
    var i = dark ? 0 : 1;
    return {
      color_time: p.time[i],
      color_date: p.date[i],
      color_today: p.today[i],
      color_accent: p.accent[i],
      colored_icons: p.icons,
      status_colors: p.status
    };
  }

  var clayConfig = this;
  if (!clayConfig || !clayConfig.EVENTS) {
    return { presetValues: presetValues };
  }

  var COLOR_KEYS = ['color_time', 'color_date', 'color_today', 'color_accent'];

  clayConfig.on(clayConfig.EVENTS.AFTER_BUILD, function () {
    function item(key) { return clayConfig.getItemByMessageKey(key); }
    var preset = item('theme_id');
    var mode = item('style_inv');
    if (!preset || !mode) { return; }

    function isDark() { return String(mode.get()) === '0'; }

    function setValue(key, value) {
      var it = item(key);
      if (it) { it.set(value); }
    }

    // The pickers hold exactly the selected preset's colors for this mode.
    function matches(dark) {
      var v = presetValues(preset.get(), dark);
      if (!v) { return false; }
      return COLOR_KEYS.every(function (key) {
        var it = item(key);
        return it && Number(it.get()) === v[key];
      });
    }

    var wasDark = isDark();

    preset.on('change', function () {
      var v = presetValues(preset.get(), isDark());
      if (!v) { return; }
      Object.keys(v).forEach(function (key) { setValue(key, v[key]); });
    });

    mode.on('change', function () {
      var dark = isDark();
      if (dark === wasDark) { return; }
      var untouched = matches(wasDark);
      wasDark = dark;
      if (!untouched) { return; }
      var v = presetValues(preset.get(), dark);
      COLOR_KEYS.forEach(function (key) { setValue(key, v[key]); });
    });
  });
};
