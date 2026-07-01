import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Import all models dynamically to register them with mongoose
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modulesDir = path.join(__dirname, 'modules');

async function loadModels() {
    const modules = fs.readdirSync(modulesDir);
    for (const mod of modules) {
        const modelsDir = path.join(modulesDir, mod, 'models');
        if (fs.existsSync(modelsDir)) {
            const files = fs.readdirSync(modelsDir);
            for (const file of files) {
                if (file.endsWith('.ts') && !file.includes('.dto.')) {
                    try {
                        const filePath = path.join(modelsDir, file);
                        const fileUrl = 'file://' + filePath;
                        await import(fileUrl);
                    } catch (e) {
                        console.error(`Error loading ${file}:`, e.message);
                    }
                }
            }
        }
    }
}

async function extract() {
    await loadModels();
    
    const schemaData = [];
    
    for (const modelName of mongoose.modelNames()) {
        const model = mongoose.model(modelName);
        const paths = model.schema.paths;
        
        const fields = [];
        for (const [pathName, pathObj] of Object.entries(paths)) {
            let type = pathObj.instance;
            
            // Handle array types
            if (type === 'Array' && pathObj.caster) {
                type = `Array<${pathObj.caster.instance}>`;
            }
            
            // Constraints
            const constraints = [];
            if (pathObj.isRequired) constraints.push('NOT NULL');
            if (pathObj.options && pathObj.options.unique) constraints.push('UNIQUE');
            if (pathObj.options && pathObj.options.ref) constraints.push(`FOREIGN KEY REFERENCES ${pathObj.options.ref}(id)`);
            
            // Description (can't automatically infer from TS, use default or comment if available, but we'll leave it blank or guess)
            let desc = '';
            if (pathName === '_id') desc = 'ID tự động sinh';
            if (pathName === 'createdAt') desc = 'Ngày tạo';
            if (pathName === 'updatedAt') desc = 'Ngày cập nhật';
            if (pathName === 'role') desc = 'Vai trò';
            
            fields.push({
                name: pathName,
                type: type,
                constraints: constraints.join(', '),
                description: desc,
                ref: (pathObj.options && pathObj.options.ref) ? pathObj.options.ref : null
            });
        }
        
        schemaData.push({
            modelName: modelName,
            fields: fields
        });
    }
    
    fs.writeFileSync('schema_extract.json', JSON.stringify(schemaData, null, 2));
    console.log('Schema extracted to schema_extract.json');
    process.exit(0);
}

extract();
