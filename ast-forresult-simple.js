const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * 判断节点是否为"独立语句"（即通常以分号结尾的语句）
 */
function isStandaloneStatement(node) {
    return t.isExpressionStatement(node) ||
        t.isVariableDeclaration(node) ||
        t.isFunctionDeclaration(node) ||
        t.isClassDeclaration(node) ||
        t.isReturnStatement(node) ||
        t.isThrowStatement(node) ||
        t.isBreakStatement(node) ||
        t.isContinueStatement(node) ||
        t.isDebuggerStatement(node) ||
        t.isEmptyStatement(node);
}

/**
 * 检查是否匹配目标模式：
 * 1. const { result } = await fetchData();
 * 2. const { result: res } = await xxx();
 */
function isTargetPattern(node) {
    if (!t.isVariableDeclaration(node)) return false;
    if (node.declarations.length !== 1) return false;
    if (node.kind !== 'const') return false;

    const decl = node.declarations[0];

    // 检查解构模式
    if (!t.isObjectPattern(decl.id)) return false;
    if (decl.id.properties.length !== 1) return false;

    const prop = decl.id.properties[0];
    if (!t.isObjectProperty(prop)) return false;
    if (!t.isIdentifier(prop.key) || prop.key.name !== 'result') return false;

    // 检查初始化是否是 await 表达式
    if (!t.isAwaitExpression(decl.init)) return false;

    return true;
}

/**
 * 获取解构中的变量名
 * { result } -> 'result'
 * { result: res } -> 'res'
 */
function getVariableName(prop) {
    // { result } 的情况
    if (!prop.value) {
        return prop.key.name;
    }
    // { result: res } 的情况
    if (t.isIdentifier(prop.value)) {
        return prop.value.name;
    }
    // 其他情况（如嵌套解构）返回 null
    return null;
}

/**
 * 转换目标语句：
 * const { result } = await fetchData(); -> const result = await fetchData().forResult();
 * const { result: res } = await xxx(); -> const res = await xxx().forResult();
 */
function transformTargetStatement(node) {
    const decl = node.declarations[0];
    const prop = decl.id.properties[0];
    const variableName = getVariableName(prop);

    if (!variableName) {
        // 如果获取不到变量名，保持原样
        return node;
    }

    const awaitExpr = decl.init;
    const originalCall = awaitExpr.argument;

    // 构建 xxx().forResult()
    const forResultCall = t.callExpression(
        t.memberExpression(originalCall, t.identifier('forResult')),
        []
    );

    // 构建 await xxx().forResult()
    const newAwaitExpr = t.awaitExpression(forResultCall);

    // 创建新的变量声明：const [variableName] = await xxx().forResult();
    const newDecl = t.variableDeclarator(
        t.identifier(variableName),
        newAwaitExpr
    );
    const newVarDecl = t.variableDeclaration('const', [newDecl]);

    // 保留原语句的注释
    newVarDecl.leadingComments = node.leadingComments;
    newVarDecl.trailingComments = node.trailingComments;

    return newVarDecl;
}

/**
 * 在 AST 中处理语句
 */
function processStatements(ast) {
    const statementsToReplace = [];

    traverse(ast, {
        enter(path) {
            const node = path.node;

            // 如果是独立语句且匹配目标模式
            if (isStandaloneStatement(node) && isTargetPattern(node)) {
                statementsToReplace.push({
                    path: path,
                    node: node
                });
            }
        }
    });

    // 执行替换
    for (const { path, node } of statementsToReplace) {
        const newVarDecl = transformTargetStatement(node);
        path.replaceWith(newVarDecl);
    }
}

/**
 * 递归遍历目录，处理所有 JS 文件
 */
async function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            await processDirectory(fullPath);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
                await processFile(fullPath);
            }
        }
    }
}

/**
 * 处理单个 JS 文件
 */
async function processFile(fullPath) {
    console.log(`Processing: ${fullPath}`);
    const code = fs.readFileSync(fullPath, 'utf8');

    try {
        // 解析为 AST
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: [
                'classProperties',
                'objectRestSpread',
                'dynamicImport',
                'optionalChaining',
                'nullishCoalescingOperator'
            ]
        });

        // 处理目标语句
        processStatements(ast);

        // 生成新代码
        const output = generate(ast, {
            retainLines: true,
            compact: false,
            comments: true
        }, code);

        // 写回文件
        fs.writeFileSync(fullPath, output.code, 'utf8');
    } catch (err) {
        console.error(`Error processing ${fullPath}:`, err.message);
    }
}

// ---- 入口 ----
const targetDir = process.cwd();

console.log(`开始处理目录: ${targetDir}`);
processDirectory(targetDir)
    .then(() => console.log('处理完成！'))
    .catch((err) => console.error('发生错误:', err));