const schedule = require('node-schedule');
const cmd = require('cmd-executor');
const configs = require('./config.json');
const exec = require('child_process').exec
const { mkdir, touch, echo, cat, rm, git, npm, mv, cp} = cmd;
const ROOT = process.cwd();
const path = require('path');
let ohterConfigs;

const scheduleCronstyle = () => {
  schedule.scheduleJob('*/30 * * * *', function(){
    console.log('scheduleCronstyle:' + new Date());
    runTask();
  }); 
}

const spliceRootConfig = (configs) => {
  let config = [].concat(configs)
  let root;
  for(let i in config){
    if(config[i].root) {
      root = config.splice(i, 1);
      ohterConfigs = config
      return root;
    }
  }
  return false;
}

const runTask = async () => {
  const root = spliceRootConfig(configs.gits);
  if (!root) {
    console.error('something wrong in config.json');
  }
  console.log(`=> rm -rf ${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}tmpelate`)
  await rm(`-rf ${configs.rootPath}/${root[0].directory}tmpelate`)
  console.log(`=> git clone ${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}tmpelate`)
  await git.clone(`${root[0].repo} -b ${root[0].branch} ${configs.rootPath}/${root[0].directory}tmpelate`)
  console.log(`rm -rf ${configs.rootPath}/${root[0].directory}tmpelate/.git`)
  await rm(`-rf ${configs.rootPath}/${root[0].directory}tmpelate/.git`)
  // console.log(`cd ${configs.rootPath}/${root[0].directory}tmpelate`)
  // process.chdir(`${configs.rootPath}/${root[0].directory}tmpelate`)
  // console.log(`=> npm install on ${configs.rootPath}/${root[0].directory}tmpelate`)
  // await npm('install')
  // console.log(`=> ./node_modules/.bin/hexo g`)
  // await simpleExec('./node_modules/.bin/hexo g')
  // console.log(`=> mv public/ .deploy/`)
  // await mv(`public/ .deploy/`)
  // process.chdir(`.deploy`)
  for(let i in ohterConfigs) {
    if (/^http(s)?/.test(ohterConfigs[i].repo)) {
      console.log(`=> git clone ${ohterConfigs[i].repo} -b ${ohterConfigs[i].branch} ${ohterConfigs[i].directory}`)
      await git.clone(`${ohterConfigs[i].repo} -b ${ohterConfigs[i].branch} ${ohterConfigs[i].directory}`)
      await rm(`-rf ${ohterConfigs[i].directory}/.git`)
    }
    else {
      await mkdir(`${path.join(ROOT, configs.rootPath,`${root[0].directory}tmpelate`,ohterConfigs[i].repo)}`)
      await cp(`-R ${path.join(ROOT, ohterConfigs[i].repo)}/* ${path.join(ROOT, configs.rootPath, `${root[0].directory}tmpelate`, ohterConfigs[i].repo)}`)
    }
  }
  console.log(`=> rm -rf ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  await rm(`-rf ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  // await mkdir(`${path.join(ROOT, configs.rootPath, root[0].directory)}`)
  console.log(`=> mv ${path.join(ROOT, configs.rootPath, `${root[0].directory}tmpelate`)}/* ${path.join(ROOT, configs.rootPath, root[0].directory)}/`)
  await mv(`${path.join(ROOT, configs.rootPath, `${root[0].directory}tmpelate`)} ${path.join(ROOT, configs.rootPath, root[0].directory)}`)
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

scheduleCronstyle();
// runTask();