import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

if (process.argv.length < 3 || process.argv[2].indexOf('help') >= 0)
{
    console.log(
        'Usage:\n' +
        'zox init <template-name> <project-name>\n' +
        'zox init <username>/<repo> <project-name>\n' +
        'Example:\n' +
        'zox init static-site-handlebars my-site\n');
}
else if (process.argv[2] == 'init')
{
    if (process.argv.length >= 5)
    {
        init(process.argv[3], process.argv[4]);
    }
    else
    {
        console.log('Command "init" requires 2 parameters');
    }
}
else
{
    console.log('Unknown command: ' + process.argv[2]);
}

function init(repo: string, name: string)
{
    if (fs.existsSync(name))
    {
        console.log(`Project "${name}" already exists.`);
        return;
    }

    if (repo.indexOf('http') != 0)
    {
        if (repo.indexOf('/') < 0)
        {
            repo = `https://github.com/zoxjs/${repo}.git`;
        }
        else
        {
            let domain;
            let userRepo;
            if (repo.indexOf(':') >= 0)
            {
                const parts = repo.split(':', 2);
                domain = parts[0].indexOf('.') >= 0 ? parts[0] : parts[0] + '.com';
                userRepo = parts[1];
            }
            else
            {
                domain = 'github.com';
                userRepo = repo;
            }
            repo = `https://${domain}/${userRepo}.git`;
        }
    }

    console.log('Cloning template repo...');
    fs.mkdirSync(name);
    process.chdir(`./${name}`);
    fs.mkdirSync('www');
    try
    {
        child_process.execSync(`git clone --depth=1 ${repo} ${name}-source`, {stdio: [0, 1, 2]});
    }
    catch(e)
    {
        process.chdir('..');
        deleteDirectorySync(name);
        return;
    }
    process.chdir(`./${name}-source`);
    deleteDirectorySync('./.git');

    console.log('Initializing...');
    try
    {
        child_process.execSync(`npm i`, {stdio: [0, 1, 2]});
    }
    catch(e)
    {
        console.error('\nFailed to install dependencies.');
        return;
    }
    try
    {
        child_process.execSync(`tsc`, {stdio: [0, 1, 2]});
    }
    catch(e)
    {
        console.error('\nFailed to compile TypeScript files.\nIf you don\'t have "tsc" installed run\nnpm i -g typescript');
        return;
    }
    child_process.execSync(`node template ${name}`, {stdio: [0, 1, 2]});
    deleteTypeScriptSync('template');

    console.log(`Created project "${name}".`);
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

function deleteTypeScriptSync(file: string)
{
    tryDeleteSync(file + '.ts');
    tryDeleteSync(file + '.d.ts');
    tryDeleteSync(file + '.js');
    tryDeleteSync(file + '.js.map');
}

function tryDeleteSync(file: string)
{
    try
    {
        fs.unlinkSync(file);
    }
    catch (e) {}
}
