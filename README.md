# Interactive Infix-to-Postfix Expression Converter and Evaluator

A Compiler Construction project that takes an arithmetic expression written in **infix**
notation, runs it through a real compiler front end &mdash; tokenizer, validator, translator,
evaluator &mdash; and shows every step of the work.

The conversion uses Dijkstra's stack-based **shunting-yard** algorithm, implemented from
scratch. No expression is hard-coded, and `eval()` is never used.

```
   10 + 5 * 2                    infix, what people write
        |
        |  lexical analysis      NUMBER(10) OP(+) NUMBER(5) OP(*) NUMBER(2)
        |  syntax validation     well-formed?
        |  shunting-yard         operator stack + output queue
        v
   10 5 2 * +                    postfix, what a machine can execute
        |
        |  stack evaluation
        v
   20
```

---

## 2. Project description

Infix notation (`10 + 5 * 2`) is convenient for people but awkward for machines: to read it
correctly you must also know operator precedence, associativity, and how to match brackets.
Postfix notation (`10 5 2 * +`) encodes all of that in the *order of the symbols*, so it can be
evaluated with a single left-to-right scan and one stack.

This project demonstrates that translation as a working web application. The compiler logic is
plain, dependency-free JavaScript that can be tested on its own; the React interface visualises
it; a small Express + SQLite backend stores a history of conversions.

---

## 3. Objectives

1. Implement a genuine, general-purpose infix-to-postfix converter, not a lookup table.
2. Separate the classic compiler phases: lexical analysis, syntax validation, translation, evaluation.
3. Handle operator precedence and associativity correctly, including right-associative `^`.
4. Support multi-digit numbers, decimals and multi-character identifiers through real tokenization.
5. Detect and clearly report invalid expressions instead of producing wrong output.
6. Evaluate postfix expressions with a stack, without using the host language's `eval()`.
7. Make every step visible so the algorithm can be understood and explained, not just trusted.
8. Persist conversion history in a local database through a REST API.

---

## 4. Features

**Compiler**

- Tokenizer producing typed tokens (`NUMBER`, `IDENTIFIER`, `OPERATOR`, `LEFT_PAREN`, `RIGHT_PAREN`)
- Maximal-munch scanning: `100` is one token, `price` is one token
- Integers, decimals, single- and multi-character identifiers
- Operators `+ - * / % ^` with correct precedence and associativity
- Unary (prefix) minus, distinguished from binary minus by the lexer
- Syntax validation with specific, positioned error messages
- Shunting-yard conversion that records a full step trace
- Stack-based postfix evaluation, including division- and modulus-by-zero handling

**Application**

- Step-by-step visualiser: token stream, live operator stack, growing output, play/pause/step controls
- Conversion trace table; click any row to jump to that step
- Evaluation trace showing each push and each operator application
- Optional variable values, so symbolic expressions can also be evaluated
- Compiler-style error reporting with a caret under the offending character
- Conversion history stored in SQLite: open, delete one, clear all
- Works with the backend switched off &mdash; only history saving is lost
- Responsive from 360&nbsp;px to desktop; keyboard accessible

---

## 5. Technologies

| Layer     | Technology                          | Why |
|-----------|-------------------------------------|-----|
| Frontend  | React 18, Vite 8                    | Component UI, instant dev server |
| Styling   | Hand-written CSS with design tokens | Full control of the visual identity; no framework needed |
| Compiler  | Plain JavaScript (no dependencies)  | Keeps the algorithm testable and framework-independent |
| Backend   | Node.js, Express 4                  | Minimal REST API |
| Database  | SQLite via `better-sqlite3`         | A single local file; no database server to install |
| Tests     | Vitest (compiler), `node:test` (API) | Fast unit tests plus real HTTP tests |

Fonts are the system stack (Segoe UI / Cascadia Mono on Windows), so the application renders
identically with no internet connection.

---

## 6. Architecture

```
  Browser                                   Node.js
 ---------------------------------      ---------------------------
  React UI                                Express REST API
      |                                        |
      |  calls                                 |  parameterised SQL
      v                                        v
  Compiler engine  (pure JS)              SQLite file
  tokenizer -> validator ->                server/data/history.db
  converter -> evaluator
      |
      |  POST /api/history  (fire and forget)
      +--------------------------------------->
```

**The conversion runs entirely in the browser.** That is a deliberate design decision:

- the compiler has no network or database dependency, so it keeps working if the backend is down;
- the step visualiser needs the trace immediately, with no round trip;
- the backend keeps one clear responsibility &mdash; persistence.

The compiler engine never imports React, and no React component contains algorithm logic.

---

## 7. Folder structure

```
CC Infix_Postfix Project/
├── package.json              root scripts; npm workspaces
├── README.md
│
├── client/                   React + Vite frontend
│   ├── vite.config.js        dev server, /api proxy, test config
│   └── src/
│       ├── compiler/                 <-- THE CORE OF THE PROJECT
│       │   ├── operators.js          precedence / associativity table
│       │   ├── tokenizer.js          lexical analysis
│       │   ├── validator.js          syntax validation
│       │   ├── infixToPostfix.js     shunting-yard + step trace
│       │   ├── evaluatePostfix.js    stack evaluation
│       │   ├── CompilerError.js      one error type for all phases
│       │   ├── index.js              driver: runs the phases in order
│       │   └── __tests__/            172 unit tests
│       ├── components/       UI components, each with its own CSS
│       ├── hooks/            useHistory, useStepPlayer, useToast
│       ├── services/api.js   HTTP client for the history API
│       ├── data/examples.js  the clickable example expressions
│       ├── styles/           design tokens and base styles
│       └── App.jsx           composes the page
│
└── server/                   Express + SQLite backend
    ├── src/
    │   ├── index.js          entry point, starts listening
    │   ├── app.js            Express app (separated so tests can start it)
    │   ├── routes/           URL -> controller
    │   ├── controllers/      request validation, status codes
    │   ├── services/         SQL statements
    │   ├── database/db.js    connection + automatic schema creation
    │   └── middleware/       error handling
    ├── tests/api.test.js     20 real HTTP tests
    └── data/history.db       created automatically on first start
```

---

## 8. Installation

Requires **Node.js 18 or newer** (developed on Node 22).

```bash
cd "CC Infix_Postfix Project"
npm install
```

One command installs both the client and the server &mdash; they are npm workspaces.

---

## 9. Running the project

```bash
npm run dev
```

This starts both processes together:

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:4000  |

Open **http://localhost:5173** in a browser. Press `Ctrl+C` to stop both.

### 10. Running them separately

```bash
npm run client     # frontend only, http://localhost:5173
npm run server     # backend only,  http://localhost:4000
```

The frontend proxies `/api/*` to port 4000, so no configuration or `.env` file is needed.
If you start only the frontend, conversion and evaluation still work &mdash; the app reports that
the history server is offline and carries on.

```bash
npm run build      # production build of the frontend
```

---

## 11. Database

- **Engine:** SQLite (file-based &mdash; no server process)
- **Location:** `server/data/history.db`
- **Created:** automatically the first time the backend starts; you never create tables by hand
- **Persistence:** the file stays on disk, so history survives restarts of the app and the machine

```sql
CREATE TABLE IF NOT EXISTS conversions (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  infix_expression   TEXT NOT NULL,
  postfix_expression TEXT NOT NULL,
  result             TEXT,          -- NULL when the expression had no numeric value
  created_at         TEXT NOT NULL  -- ISO-8601 timestamp
);
```

`result` is nullable on purpose: `A + B * C` converts perfectly well but has no value until the
variables are given numbers.

To reset the history completely, use **Clear all** in the UI, or delete `server/data/` and
restart the backend.

---

## 12. API endpoints

Base URL `http://localhost:4000/api`

| Method   | Endpoint         | Purpose                     | Success | Errors |
|----------|------------------|-----------------------------|---------|--------|
| `GET`    | `/health`        | Is the API and DB alive?    | `200`   | &mdash; |
| `GET`    | `/history`       | List conversions, newest first (`?limit=` 1&ndash;200, default 50) | `200` | &mdash; |
| `POST`   | `/history`       | Save one conversion         | `201`   | `400` invalid body |
| `DELETE` | `/history/:id`   | Delete one conversion       | `200`   | `400` bad id, `404` not found |
| `DELETE` | `/history`       | Delete every conversion     | `200`   | &mdash; |

**POST body**

```json
{ "infixExpression": "10 + 5 * 2", "postfixExpression": "10 5 2 * +", "result": "20" }
```

`result` may be omitted or `null`. Expressions are required, must be non-empty strings and at
most 500 characters.

**Response shapes**

```json
{ "data": [ ... ], "count": 2 }                    // GET  /history
{ "data": { "id": 1, "infixExpression": "...",     // POST /history
            "postfixExpression": "...", "result": "20",
            "createdAt": "2025-03-12T09:14:02.511Z" } }
{ "deleted": 1, "id": 1 }                          // DELETE /history/1
{ "error": "infixExpression is required and must be a non-empty string." }
```

Errors always return `{ "error": "<readable message>" }`. Stack traces and raw SQLite messages
are never sent to the client.

---

## 13. Supported operators

| Operator | Meaning        | Example   |
|----------|----------------|-----------|
| `+`      | Addition       | `A + B`   |
| `-`      | Subtraction    | `A - B`   |
| `*`      | Multiplication | `A * B`   |
| `/`      | Division       | `A / B`   |
| `%`      | Modulus        | `A % B`   |
| `^`      | Exponentiation | `A ^ B`   |
| `( )`    | Grouping       | `(A + B) * C` |
| `-x`     | Unary minus    | `-5 + 3`  |

**Operands**

| Kind                     | Examples                    |
|--------------------------|-----------------------------|
| Integers                 | `5`, `10`, `100`, `2500`    |
| Decimals                 | `3.14`, `10.5`, `25.75`     |
| Single-char identifiers  | `A`, `B`, `X`               |
| Multi-char identifiers   | `price`, `total`, `marks2`  |

Identifiers start with a letter or `_` and may then contain letters, digits and `_`.

---

## 14. Operator precedence

Higher binds tighter:

| Level | Operators | Associativity | Meaning |
|-------|-----------|---------------|---------|
| 4     | `^`       | **Right**     | Exponentiation |
| 3     | `-x`      | Right         | Unary minus |
| 2     | `*` `/` `%` | Left        | Multiplication, division, modulus |
| 1     | `+` `-`   | Left          | Addition, subtraction |

Parentheses override all of it: a `(` is pushed as a fence and nothing below it may be popped
until the matching `)` is reached.

## 15. Associativity

Associativity decides how operators of **equal** precedence group.

| Expression   | Groups as     | Postfix       |
|--------------|---------------|---------------|
| `A - B - C`  | `(A - B) - C` | `A B - C -`   |
| `A / B / C`  | `(A / B) / C` | `A B / C /`   |
| `A ^ B ^ C`  | `A ^ (B ^ C)` | `A B C ^ ^`   |

In the algorithm this is a single condition: on an equal-precedence clash, pop first if the
incoming operator is **left** associative, and do not pop if it is **right** associative.
That one line is why `2 ^ 3 ^ 2` evaluates to `512` (`2^9`) and not `64` (`8^2`).

---

## 16. Algorithm explanation

### 16.1 The stack, in one sentence

An operator cannot be written to the output until we are sure nothing to its right binds more
tightly. The stack holds exactly those operators that are still waiting for that decision, and
the most recently postponed one is always resolved first &mdash; last in, first out.

### 16.2 Conversion (shunting-yard)

Scan the tokens left to right, keeping an **output list** and an **operator stack**:

1. **Operand** &rarr; append it to the output. Operand order never changes.
2. **`(`** &rarr; push it.
3. **`)`** &rarr; pop operators into the output until `(` appears, then discard both brackets.
4. **Operator** &rarr; while the operator on top of the stack must be applied first, pop it into
   the output; then push the current operator.
5. **End of input** &rarr; pop everything left on the stack into the output.
6. A `(` still on the stack at the end means the brackets were unbalanced.

Step 4 is the only place precedence and associativity matter:

```js
function shouldPopBeforePushing(stackTop, incoming) {
  if (stackTop === '(') return false            // never pop past a bracket
  if (isUnary(incoming)) return false           // a prefix operator binds to its right

  const top = getPrecedence(stackTop)
  const now = getPrecedence(incoming)

  if (top > now) return true                            // top binds tighter
  if (top === now && !isRightAssociative(incoming)) return true  // tie: left assoc pops
  return false
}
```

**Worked example: `A + B * C`**

| Step | Token | Action                        | Stack | Output      |
|------|-------|-------------------------------|-------|-------------|
| 1    | `A`   | append operand                | &mdash; | `A`       |
| 2    | `+`   | push (stack empty)            | `+`   | `A`         |
| 3    | `B`   | append operand                | `+`   | `A B`       |
| 4    | `*`   | push (`*` beats `+`, no pop)  | `+ *` | `A B`       |
| 5    | `C`   | append operand                | `+ *` | `A B C`     |
| 6    | END   | pop remaining: `*`, `+`       | &mdash; | `A B C * +` |

Compare `(A + B) * C`: the brackets force `+` out at step 5, giving `A B + C *`.

### 16.3 Evaluation

Postfix needs no brackets and no precedence, so one scan and one stack suffice:

1. **Operand** &rarr; push its value.
2. **Operator** &rarr; pop the operands it needs, apply it, push the result.
3. At the end exactly one value remains &mdash; the answer.

The **right** operand is popped first, because it was pushed last. Getting that backwards
silently breaks `-` and `/`, so the visualiser prints both operands at each step.

```
10 5 2 * +     push 10      [10]
               push 5       [10, 5]
               push 2       [10, 5, 2]
               '*' pops 5,2 [10, 10]
               '+' pops     [20]      -> 20
```

### 16.4 Why the phases are separate

Each stage has one job and hands the next stage a cleaner input:

| Phase | Input | Output | File |
|-------|-------|--------|------|
| Lexical analysis  | characters | tokens        | `tokenizer.js` |
| Syntax validation | tokens     | valid / error | `validator.js` |
| Translation       | tokens     | postfix + trace | `infixToPostfix.js` |
| Evaluation        | postfix    | a number      | `evaluatePostfix.js` |

Because validation happens first, the converter can assume its input is well-formed, which is
what keeps it short enough to read in one sitting.

---

## 17. Example conversions

| Infix                 | Postfix           | Result |
|-----------------------|-------------------|--------|
| `A + B * C`           | `A B C * +`       | needs values |
| `(A + B) * C`         | `A B + C *`       | needs values |
| `A * (B + C)`         | `A B C + *`       | needs values |
| `A ^ B ^ C`           | `A B C ^ ^`       | needs values |
| `10 + 5 * 2`          | `10 5 2 * +`      | `20`   |
| `(10 + 5) * 2`        | `10 5 + 2 *`      | `30`   |
| `10 + (5 * (2 + 3))`  | `10 5 2 3 + * +`  | `35`   |
| `2 ^ 3 ^ 2`           | `2 3 2 ^ ^`       | `512`  |
| `100 - 20 - 5`        | `100 20 - 5 -`    | `75`   |
| `3.14 * 2`            | `3.14 2 *`        | `6.28` |
| `price + tax * 2`     | `price tax 2 * +` | needs values |
| `-5 + 3`              | `5 u- 3 +`        | `-2`   |

> `u-` is how unary (prefix) minus is written in the postfix output. It is kept distinct from
> binary `-` so that "negate" and "subtract" cannot be confused: `5 u-` is &minus;5, while
> `5 3 -` is 2.

**Rejected input**

| Input        | Message |
|--------------|---------|
| *(empty)*    | Expression cannot be empty. |
| `A + * B`    | Invalid operator sequence: `'+'` followed by `'*'`. |
| `A +`        | Expression cannot end with an operator. |
| `* A + B`    | Expression cannot begin with the operator `'*'`. |
| `(A + B`     | Mismatched parentheses: one unclosed `'('`. |
| `A + B)`     | Mismatched parentheses: unexpected `')'`. |
| `A @ B`      | Invalid character `'@'`. |
| `3.14.15`    | Malformed number `'3.14.15'`. A number may contain at most one decimal point. |
| `5x`         | Malformed number `'5x'`. A number cannot be directly followed by a letter. |
| `A B`        | Missing operator between `'A'` and `'B'`. |
| `10 / 0`     | Converts to `10 0 /`; evaluation reports division by zero. |

---

## 18. Testing

```bash
npm test              # everything: compiler unit tests + API tests
npm run test:compiler # compiler only (Vitest)
npm run test:api      # backend only (node:test, real HTTP requests)
```

**Compiler &mdash; 172 unit tests** (`client/src/compiler/__tests__/`)

| File                      | Covers |
|---------------------------|--------|
| `tokenizer.test.js`       | multi-digit numbers, decimals, identifiers, whitespace, unary vs binary minus, invalid characters, malformed numbers |
| `validator.test.js`       | empty input, bracket balance, consecutive operators, leading/trailing operators, missing operators, error positions |
| `infixToPostfix.test.js`  | `getPrecedence`, `isRightAssociative`, `shouldPopBeforePushing`, precedence, brackets, associativity, the step trace |
| `evaluatePostfix.test.js` | arithmetic, operand order, variables, division/modulus by zero, non-finite results, malformed postfix |
| `convert.test.js`         | the documented examples end to end; every invalid input returns a result object rather than throwing |

These tests import the compiler directly and never render a React component, which is the point
of keeping the engine framework-free.

**Backend &mdash; 20 HTTP tests** (`server/tests/api.test.js`)

The Express app is started on a throwaway port and driven with `fetch()`: status codes, response
shapes, validation failures, malformed JSON, 404s, and a SQL-injection string that is stored as
plain text and leaves the table intact. They run against a temporary database file, so running
the tests never touches your real history.

**Manual/browser verification performed**

Conversion and evaluation of 32 expressions through the UI; all eight error cases; variable
evaluation; play / pause / step / jump controls; history save, reopen, single delete and clear
all; persistence across a full server restart; behaviour with the backend stopped; layout at
eight viewport widths from 360&nbsp;px to 1440&nbsp;px; keyboard navigation and focus order.
No console errors were produced.

---

## 19. Limitations

- **Binary operators only** (plus prefix minus). There are no functions such as `sin` or `sqrt`,
  and no comma-separated arguments.
- **No implicit multiplication.** `2(3)` and `A B` are rejected as missing an operator, on purpose.
- **Numbers are IEEE-754 doubles**, so very large or very precise values lose accuracy. Results
  are rounded for display to avoid artefacts like `0.30000000000000004`.
- **`%` follows JavaScript semantics** for negative operands (`-7 % 3` is `-1`, not `2`).
- **Variable values are not persisted.** History stores the result that existed when the
  conversion was saved; entering values afterwards updates the screen, and pressing **Convert**
  again saves a row that includes the value.
- **History is not paginated**; the UI requests the 50 most recent conversions.
- **Single user, no authentication.** It is a local teaching tool, and adding accounts would add
  nothing to the compiler topic.

---

## 20. Future improvements

- Prefix (Polish) notation output alongside postfix
- An expression tree / AST view rendered beside the stack
- Step-through *backwards* animation, and an adjustable animation speed
- Functions (`sqrt`, `min`, `max`) &mdash; a good exercise in extending the operator table
- Export a conversion trace as CSV or a printable page for submission
- A light theme for projectors

---

## Quick reference for studying

The five files that contain the whole compiler, in the order they run:

1. `client/src/compiler/tokenizer.js` &mdash; characters to tokens
2. `client/src/compiler/validator.js` &mdash; is the token sequence well-formed?
3. `client/src/compiler/operators.js` &mdash; the precedence and associativity table
4. `client/src/compiler/infixToPostfix.js` &mdash; the shunting-yard algorithm
5. `client/src/compiler/evaluatePostfix.js` &mdash; stack evaluation

`client/src/compiler/index.js` ties them together and is the only file the UI calls.
