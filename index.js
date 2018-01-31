const schedule = require('node-schedule');
const cmd = require('cmd-executor');
const configs = require('./config.json');
const exec = require('child_process').exec
const { mkdir, touch, echo, cat, rm, git, npm, mv, cp} = cmd;
const ROOT = process.cwd();
const path = require('path');

const scheduleCronstyle = () => {
  schedule.scheduleJob('30 * * * * *', function(){
    console.log('scheduleCronstyle:' + new Date());
    runTask();
  }); 
}

const spliceRootConfig = (configs) => {
  for(let i in configs){
    if(configs[i].root) {
      return configs.splice(i, 1);
    }
  }
  return false;
}

const runTask = async () => {
  const root = spliceRootConfig(configs.gits);
  if (!root) {
    console.error('something wrong in config.json');
  }
  console.log(`=> rm -rf ${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}_tmp`)
  await rm(`-rf ${configs.rootPath}/${root[0].directory}_tmp`)
  console.log(`=> git clone ${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}_tmp`)
  await git.clone(`${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}_tmp`)
  await rm(`-rf ${configs.rootPath}/${root[0].directory}_tmp/.git`)
  process.chdir(`${configs.rootPath}/${root[0].directory}_tmp`)
  console.log(`=> npm install on ${configs.rootPath}/${root[0].directory}_tmp`)
  await npm('install')
  console.log(`=> ./node_modules/.bin/hexo g`)
  await simpleExec('./node_modules/.bin/hexo g')
  console.log(`=> mv public/ .deploy/`)
  await mv(`public/ .deploy/`)
  process.chdir(`.deploy`)
  for(let i in configs.gits) {
    if (/^http(s)?/.test(configs.gits[i].repo)) {
      console.log(`=> git clone ${configs.gits[i].repo} -b ${configs.gits[i].branch} ${configs.gits[i].directory}`)
      await git.clone(`${configs.gits[i].repo} -b ${configs.gits[i].branch} ${configs.gits[i].directory}`)
      await rm(`-rf ${configs.gits[i].directory}/.git`)
    }
    else {
      await mkdir(configs.gits[i].repo)
      await cp(`-R ${path.join(ROOT, configs.gits[i].repo)}/* ${path.join(ROOT, configs.rootPath, `${root[0].directory}_tmp`, '.deploy', configs.gits[i].repo)}`)
    }
  }
  console.log(`=> rm -rf ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  await rm(`-rf ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  await mkdir(`${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  console.log(`=> mv .deploy/ ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  await cp(`-R ${path.join(ROOT, configs.rootPath, `${root[0].directory}_tmp`, '.deploy')}/* ${path.join(ROOT, configs.rootPath, root[0].directory)}/`)
  console.log('Successful Update!')
}

const simpleExec = async (cmd) => {
  return new Promise(function (resolve, reject) {
    exec(cmd, function (err, stdout, stderr) {
      if (err) return reject(err)
      resolve(stdout || stderr)
    })
  })
}
