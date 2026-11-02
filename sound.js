/* Workshop sounds, made in the browser. No audio files to upload. */
(function (root) {
  var ctx = null;
  var sfx = null;
  var music = null;
  var muted = false;
  var musicMuted = false;
  var musicOn = false;
  var stepIndex = 0;
  var nextNote = 0;
  var track = {
    bpm: 86,
    bass: [45, 0, 45, 0, 48, 0, 43, 0, 45, 0, 41, 0, 48, 0, 45, 0],
    lead: [69, 0, 0, 72, 0, 76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 72],
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    hat: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
  };

  function unlock() {
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC({ latencyHint: "interactive" });
      sfx = ctx.createGain();
      sfx.gain.value = 0.32;
      sfx.connect(ctx.destination);
      music = ctx.createGain();
      music.gain.value = 0.2;
      music.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  function midi(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function blip(bus, freq, time, dur, type, peak, cutoff) {
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(bus);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function drumKick(time) {
    var osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(148, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.09);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.28, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    osc.connect(g);
    g.connect(music);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  function drumNoise(time, freq, dur, peak) {
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(music);
    src.start(time);
    src.stop(time + dur);
  }

  function tone(freq, dur, type, peak, slideTo) {
    if (!ctx || muted || !sfx) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo && slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, peak, freq) {
    if (!ctx || muted || !sfx) return;
    var n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    var t = ctx.currentTime;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    src.start();
  }

  function arpeggio(freqs, type, peak) {
    if (!ctx || muted || !sfx) return;
    freqs.forEach(function (f, i) {
      var when = ctx.currentTime + i * 0.09;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(peak, when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
      g.connect(sfx);
      var osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f, when);
      osc.connect(g);
      osc.start(when);
      osc.stop(when + 0.22);
    });
  }

  function play(name) {
    unlock();
    switch (name) {
      case "flip":
        noise(0.045, 0.18, 1600);
        tone(220, 0.05, "square", 0.05);
        break;
      case "launch":
        noise(0.18, 0.16, 500);
        tone(180, 0.16, "sawtooth", 0.06, 70);
        break;
      case "bumper":
        tone(520, 0.12, "sine", 0.1, 180);
        break;
      case "target":
        tone(880, 0.08, "sine", 0.08, 1320);
        break;
      case "ramp":
        arpeggio([523, 659, 784], "sine", 0.07);
        break;
      case "slot":
        tone(180, 0.16, "triangle", 0.1, 90);
        tone(520, 0.14, "sine", 0.06);
        break;
      case "drain":
        tone(320, 0.28, "sawtooth", 0.06, 70);
        break;
      case "saver":
        arpeggio([660, 880], "sine", 0.07);
        break;
      case "goal":
        arpeggio([523, 659, 784, 1046], "triangle", 0.08);
        break;
      case "victory":
        arpeggio([523, 659, 784, 1046, 1318], "triangle", 0.09);
        break;
      case "over":
        tone(220, 0.4, "triangle", 0.08, 80);
        break;
      default:
        break;
    }
  }

  function tick(on) {
    if (!ctx || !music || musicMuted || !on) {
      musicOn = false;
      return;
    }
    if (!musicOn) {
      musicOn = true;
      stepIndex = 0;
      nextNote = ctx.currentTime + 0.06;
    }
    var stepDur = 60 / track.bpm / 4;
    if (nextNote < ctx.currentTime - 0.05) nextNote = ctx.currentTime + 0.04;
    var horizon = ctx.currentTime + 0.28;
    while (nextNote < horizon) {
      var i = stepIndex % 16;
      if (track.kick[i]) drumKick(nextNote);
      if (track.snare[i]) drumNoise(nextNote, 1800, 0.08, 0.12);
      if (track.hat[i]) drumNoise(nextNote, 7000, 0.03, 0.045);
      if (track.bass[i]) blip(music, midi(track.bass[i]), nextNote, 0.16, "sawtooth", 0.07, 240);
      if (track.lead[i]) blip(music, midi(track.lead[i]), nextNote, 0.11, "square", 0.035, 1800);
      stepIndex += 1;
      nextNote += stepDur;
    }
  }

  function toggleSound() {
    unlock();
    muted = !muted;
    if (sfx && ctx) sfx.gain.setTargetAtTime(muted ? 0 : 0.32, ctx.currentTime, 0.02);
    return muted;
  }

  function toggleMusic() {
    unlock();
    musicMuted = !musicMuted;
    if (music && ctx) music.gain.setTargetAtTime(musicMuted ? 0 : 0.2, ctx.currentTime, 0.02);
    if (musicMuted) musicOn = false;
    return musicMuted;
  }

  root.AGSound = { unlock: unlock, play: play, tick: tick, toggleSound: toggleSound, toggleMusic: toggleMusic };
})(typeof window !== "undefined" ? window : this);
