const reserved = [
  "if",
  "else",
  "while",
  "default",
  "do",
  "function",
  "export",
  "continue",
  "return",
  "for",
  "break",
  "let",
  "const"
];
const breakline = "\n";
const space = "\u0020";
const quotes = ["\u0027", "\u0022"];
const whitespace = [space, breakline, "\t"];
const char_code_zero = "0".charCodeAt(0);
const char_code_nine = "9".charCodeAt(0);
const float_delimiter = ".";
const hex_delimiter = "x";
const hex_digits = ["a", "b", "c", "d", "e", "f"];
const operators = ["=", "<", ">", "+", "-", "=", "/", "*", "?", "++", "--", "+=", "-=", "<=", ">=", "=="];
const named_tokens = {
  ",": "comma",
  ".": "dot",
  "[": "bracket_begin",
  "]": "bracket_end",
  "(": "paran_begin",
  ")": "paran_end",
  "{": "curly_begin",
  "}": "curly_end",
  ";": "semicolon",
  ":": "colon"
};
const reserved_identifiers = ["null", "undefined", "true", "false"];
const comment_pairs = {
  "//": breakline,
  "/*": "*/"
};
export default function tokenize(text) {
  /* this piece of function intentionally implemented as explicit as possible
     e.g. `else if` not used, so many duplications are involved, in order
     to illustrate the tokenization process */
  const errors = [];
  const tokens = [];
  const text_length = text.length;
  let current_token;
  let current_quote;
  let skip_until_next_token = false;
  let skip_until;
  let prev;
  let comment = "";
  for (let i = 0; i < text_length; i++) {
    const token = text[i];
    if (i > 0) {
      prev = text[i - 1];
    }
    const token_with_previous = prev + token;
    if (skip_until) {
      if (skip_until.length === 1) {
        if (skip_until === token) {
          skip_until = undefined;
          tokens.push(current_token);
          current_token = undefined;
        } else {
          current_token.value += token;
          current_token.ends = i + 1;
        }
      } else {
        current_token.value += token;
        if (skip_until === token_with_previous) {
          current_token.ends = i+1;
          tokens.push(current_token);
          skip_until = undefined;
          current_token = undefined;
        }
      }
      continue;
    }
    if (!current_quote && comment_pairs.hasOwnProperty(token_with_previous)) {
      skip_until = comment_pairs[token_with_previous];
      if (current_token) {
        tokens.pop();
        current_token = undefined;
      }
      current_token = {type: "comment", value: token_with_previous, starts: i - 1, ends: i}
      continue;
    }
    const lower_case = token.toLowerCase();
    const char_code = token.charCodeAt(0);
    const is_whitespace = whitespace.includes(token);
    const is_named_token = named_tokens.hasOwnProperty(token);
    const is_operator = operators.includes(token);
    const is_quote = quotes.includes(token);
    const is_digit = char_code >= char_code_zero && char_code <= char_code_nine;
    const is_hex_delimiter = lower_case === hex_delimiter;
    if (current_quote === token) {
      current_quote = undefined;
      current_token.ends = i + 1;
      current_token = undefined;
    } else {
      if (is_quote && !current_quote) {
        current_quote = token;
        current_token = {
          type: "string",
          value: "",
          starts: i,
          ends: i + 1,
          quote: current_quote
        };
        tokens.push(current_token);
      } else {
        if (is_whitespace && !current_quote) {
          if (current_token) {
            current_token = undefined;
          }
        } else {
          if (current_token) {
            const token_next_value = current_token.value + token;
            if (is_operator || is_named_token) {
            } else {
              if (current_token.type === "reserved") {
                current_token.type = "identifier";
              } else {
                if (current_token.type === "reserved-identifier") {
                  current_token.type = "identifier";
                }
              }
            }
            if (current_token.type === "identifier") {
              if (reserved.includes(token_next_value)) {
                current_token.type = "reserved";
              } else {
                if (reserved_identifiers.includes(token_next_value)) {
                  current_token.type = "reserved-identifier";
                }
              }
              if (is_operator || is_named_token) {
                current_token = undefined;
              }
            } else {
              if (current_token.type === "operator") {
                if (operators.includes(token_next_value)) {
                } else {
                  current_token = undefined;
                }
              } else {
                if (current_token.type === "reserved") {
                  if (is_operator || is_named_token) {
                    current_token = undefined;
                  }
                } else {
                  if (current_token.type === "reserved-identifier") {
                    if (is_operator || is_named_token) {
                      current_token = undefined;
                    }
                  } else {
                    if (current_token.type === "number") {
                      if (is_operator || is_named_token) {
                        current_token = undefined;
                      }
                    }
                  }
                }
              }
            }
          }
          if (current_token) {
            const token_next_value = current_token.value + token;
            if (skip_until_next_token) {
            } else {
              if (current_token.type === "number") {
                if (is_digit) {
                  current_token.value = token_next_value;
                  current_token.ends = i + 1;
                } else {
                  if (current_token.value === "0" && is_hex_delimiter) {
                    if (current_token.value.includes(hex_delimiter)) {
                      errors.push({ token: current_token, error: "Invalid hex number" });
                      skip_until_next_token = true;
                    } else {
                      current_token.value = token_next_value;
                      current_token.is_hex = true;
                      current_token.ends = i + 1;
                    }
                  } else {
                    if (token === float_delimiter) {
                      if (current_token.value.includes(float_delimiter)) {
                        errors.push({ token: current_token, error: "Invalid float number" });
                        skip_until_next_token = true;
                      } else {
                        current_token.value = token_next_value;
                        current_token.is_float = true;
                        current_token.ends = i + 1;
                      }
                    } else {
                      if (current_token.is_hex) {
                        if (hex_digits.includes(lower_case)) {
                          current_token.value = token_next_value;
                          current_token.ends = i + 1;
                        } else {
                          errors.push({ token: current_token, error: "Invalid hex number" });
                          skip_until_next_token = true;
                        }
                      } else {
                        errors.push({ token: current_token, error: "Invalid number" });
                        skip_until_next_token = true;
                      }
                    }
                  }
                }
              } else {
                current_token.value = token_next_value;
                current_token.ends = i + 1;
              }
            }
          } else {
            const token_created = {
              value: token,
              starts: i,
              ends: i + 1
            };
            if (is_named_token) {
              token_created.type = named_tokens[token];
            } else {
              token_created.type = is_operator ? "operator" : is_digit ? "number" : "identifier";
              current_token = token_created;
            }
            tokens.push(token_created);
            skip_until_next_token = false;
          }
        }
      }
    }
  }
  return { tokens, errors };
}
