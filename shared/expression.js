/**
 * shared/expression.js — arithmetic typed into number fields: "1500/60", "2*pi*0.5", "sqrt(9.81*30)" evaluate to a
 * number wherever a number is expected. A recursive-descent parser (no eval): numbers, + − × ÷ ^ (also * / ** and the
 * Unicode signs), parentheses, unary signs, the constant pi and the functions sqrt, abs, ln, log10, exp, min, max.
 * DOM-free; used by the form renderer and the tools panel.
 */

const MAX_LENGTH = 200;
const PLAIN_NUMBER = /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i;
const FUNCTIONS = { sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log10: Math.log10, exp: Math.exp, min: Math.min, max: Math.max };
const CONSTANTS = { pi: Math.PI, 'π': Math.PI };
export const EXPRESSION_HELP = 'Enter a number or a formula such as 1500/60, 2*pi*0.5 or sqrt(9.81*30).';

/** True when the text is an ordinary number (no formula), so no "= value" hint is needed. */
export const isPlainNumber = (text) => PLAIN_NUMBER.test(String(text));

function tokenize(text) {
  const source = String(text)
    .replace(/\*\*/g, '^')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-');
  const tokens = [];
  let k = 0;
  while (k < source.length) {
    const rest = source.slice(k);
    const space = rest.match(/^\s+/);
    if (space) { k += space[0].length; continue; }
    const number = rest.match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
    if (number) { tokens.push({ kind: 'number', value: Number(number[0]) }); k += number[0].length; continue; }
    const name = rest.match(/^[a-zπ][a-z0-9_]*/i);
    if (name) { tokens.push({ kind: 'name', value: name[0].toLowerCase() }); k += name[0].length; continue; }
    if ('+-*/^(),'.includes(rest[0])) { tokens.push({ kind: rest[0] }); k += 1; continue; }
    throw new Error(`"${rest[0]}" is not allowed in a number field. ${EXPRESSION_HELP}`);
  }
  return tokens;
}

/** Evaluate a number or arithmetic expression; throws an Error with a readable message unless the result is finite. */
export function evaluateExpression(text) {
  const source = String(text).trim();
  if (source === '') throw new Error('Enter a value.');
  if (source.length > MAX_LENGTH) throw new Error(`A formula may be at most ${MAX_LENGTH} characters.`);
  if (isPlainNumber(source)) return Number(source);
  if (/^[+-]?\d+,\d+$/.test(source)) throw new Error(`Use a point as the decimal separator (${source.replace(',', '.')}).`);
  const tokens = tokenize(source);
  let k = 0;
  const peek = () => tokens[k];
  const expect = (kind) => {
    if (!peek() || peek().kind !== kind) throw new Error(`Incomplete formula: "${kind}" expected. ${EXPRESSION_HELP}`);
    k += 1;
  };
  const expression = () => {
    let value = term();
    while (peek() && (peek().kind === '+' || peek().kind === '-')) {
      const op = tokens[k++].kind;
      value = op === '+' ? value + term() : value - term();
    }
    return value;
  };
  const term = () => {
    let value = unary();
    while (peek() && (peek().kind === '*' || peek().kind === '/')) {
      const op = tokens[k++].kind;
      value = op === '*' ? value * unary() : value / unary();
    }
    return value;
  };
  // a sign applies to the whole power (−2^2 = −4); the exponent may carry its own sign (2^−1 = 0.5), ^ is right-associative
  const unary = () => {
    if (peek() && (peek().kind === '+' || peek().kind === '-')) {
      const op = tokens[k++].kind;
      const value = unary();
      return op === '-' ? -value : value;
    }
    return power();
  };
  const power = () => {
    const base = primary();
    if (peek() && peek().kind === '^') {
      k += 1;
      return base ** unary();
    }
    return base;
  };
  const primary = () => {
    const token = peek();
    if (!token) throw new Error(`Incomplete formula. ${EXPRESSION_HELP}`);
    k += 1;
    if (token.kind === 'number') return token.value;
    if (token.kind === '(') {
      const value = expression();
      expect(')');
      return value;
    }
    if (token.kind === 'name') {
      if (token.value in CONSTANTS) return CONSTANTS[token.value];
      const fn = FUNCTIONS[token.value];
      if (!fn) throw new Error(`Unknown name "${token.value}": use pi, sqrt, abs, ln, log10, exp, min or max.`);
      expect('(');
      const args = [expression()];
      while (peek() && peek().kind === ',') {
        k += 1;
        args.push(expression());
      }
      expect(')');
      if (args.length > 1 && token.value !== 'min' && token.value !== 'max') throw new Error(`${token.value}() takes one value.`);
      return fn(...args);
    }
    throw new Error(`Unexpected "${token.kind}". ${EXPRESSION_HELP}`);
  };
  const value = expression();
  if (k < tokens.length) throw new Error(`Unexpected "${tokens[k].kind === 'number' ? tokens[k].value : tokens[k].kind}" after the formula. ${EXPRESSION_HELP}`);
  if (!Number.isFinite(value)) throw new Error('The formula does not give a finite number (division by zero or a value out of range).');
  return value;
}

/** The number a field's text stands for, or NaN when it is empty or not a valid formula (for the tools' own fields). */
export function numberFromText(text) {
  try {
    return evaluateExpression(text);
  } catch {
    return NaN;
  }
}
