const ANSI = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",

  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
};

function logInfo(msg: string) {
  return console.info(Time(), `${ANSI.FgGreen}[INFO]${ANSI.Reset}`, msg);
}

function logWarning(msg: string) {
  return console.warn(Time(), `${ANSI.FgYellow}[WARN]${ANSI.Reset}`, msg);
}

function logError(msg: string) {
  return console.error(Time(), `${ANSI.FgRed}[ERROR]${ANSI.Reset}`, msg);
}

export const log = {
  info: logInfo,
  warn: logWarning,
  error: logError,
};

function Time() {
  return `${new Date().toLocaleString()}:\t`;
}

export async function getTaoPrice() {
  const res = await fetch(
    "https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=0x410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af",
  );
  const body = await res.json()
  const result = (body["parsed"]?.[0]?.["price"]?.["price"]) ?? 0;
  if(result == 0){
    return null
  }
  return result / 1e8;
}

export const CREDIT_PER_DOLLAR = 25000000;
