import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

if (process.argv[2] == 'init' && process.argv.length >= 5)
{
    let repo = process.argv[3];
    if (repo.indexOf('/') < 0)
    {
        repo = 'zoxjs/' + repo;
    }
    const name = process.argv[4];

    console.log('Cloning template repo...');
    fs.mkdirSync(name);
    process.chdir(`./${name}`);
    fs.mkdirSync('www');
    child_process.execSync(`git clone --depth=1 https://github.com/${repo}.git ${name}-source`, {stdio:[0,1,2]});
    process.chdir(`./${name}-source`);
    deleteDirectorySync('./.git');

    console.log('Initializing...');
    child_process.execSync(`npm i`, {stdio:[0,1,2]});
    child_process.execSync(`tsc`, {stdio:[0,1,2]});
    child_process.execSync(`node template ${name}`, {stdio:[0,1,2]});
    deleteTypeScript('template');
}
else
{
    console.log('Unknown command: ' + process.argv.slice(2).join(' '));
}

function deleteDirectorySync(directory: string)
{
    const files = fs.readdirSync(directory);
    for (let i = 0; i < files.length; ++i)
    {
        const file = path.join(directory, files[i]);
        try
        {
            const stat = fs.statSync(file);
            if (stat.isDirectory())
            {
                deleteDirectorySync(file);
            }
            else if (stat.isFile())
            {
                fs.unlinkSync(file);
            }
        }
        catch(e) {}
    }
    fs.rmdirSync(directory);
}

function deleteTypeScript(file: string)
{
    tryDelete(file + '.ts');
    tryDelete(file + '.d.ts');
    tryDelete(file + '.js');
    tryDelete(file + '.js.map');
}

function tryDelete(file: string)
{
    try
    {
        fs.unlinkSync(file);
    }
    catch (e) {}
}
