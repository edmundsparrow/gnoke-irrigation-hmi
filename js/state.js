/**
 * state.js — Gnoke Irrigation
 */
const State = (() => {
  const today = new Date().toISOString().split('T')[0];

  const DEFAULTS = {
    activePage : 'zones-page',
    today      : today,
  };

  let _state = { ...DEFAULTS };
  const _listeners = {};

  function get(key)         { return _state[key]; }
  function set(key, value)  { _state[key] = value; (_listeners[key] || []).forEach(fn => fn(value)); }
  function on(key, callback){ if (!_listeners[key]) _listeners[key] = []; _listeners[key].push(callback); }
  function reset()          { _state = { ...DEFAULTS }; }

  return { get, set, on, reset, DEFAULTS };
})();
