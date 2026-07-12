const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const code = fs.readFileSync('skill2.js', 'utf-8');
const ast = parser.parse(code, { sourceType: 'module' });

traverse(ast, {
    ObjectExpression(path) {
        // 不再判断 parent.isVariableDeclarator()，所有对象都处理
        const properties = path.get('properties');
        const seen = new Set();

        // 从后向前遍历，保留最后一个，删除前面的重复项
        for (let i = properties.length - 1; i >= 0; i--) {
            const prop = properties[i];
            if (!prop.isObjectProperty()) continue;

            const key = prop.get('key');
            let keyName = null;
            if (key.isIdentifier()) keyName = key.node.name;
            else if (key.isStringLiteral()) keyName = key.node.value;
            else if (key.isNumericLiteral()) keyName = String(key.node.value);
            else continue; // 计算属性名（如 [expr]）跳过

            if (seen.has(keyName)) {
                prop.remove(); // 删除靠前的重复项
            } else {
                seen.add(keyName);
            }
        }
    }
});

fs.writeFileSync('skill2.js', generate(ast, { retainLines: true }).code);