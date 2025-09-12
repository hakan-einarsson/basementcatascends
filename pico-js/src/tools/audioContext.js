const audioCtx = new (window.AudioContext || window.webkitAudioContext)();


export const getAudioContext = () => audioCtx;