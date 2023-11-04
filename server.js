const Koa = require('koa')
const fs = require('fs')
const path = require('path')
const router = require('koa-router')()
const { koaBody } = require('koa-body')
const cors = require('koa2-cors')
const static = require('koa-static')

const app = new Koa()

/* 
  koa-body 对应的API及使用 看这篇文章 http://www.ptbird.cn/koa-body.html
  或者看 github上的官网 https://github.com/dlau/koa-body
*/
app.use(
  koaBody({
    multipart: true, // 支持文件上传
    formidable: {
      maxFieldsSize: 2 * 1024 * 1024, // 最大文件为2兆
      multipart: true // 是否支持 multipart-formdate 的表单
    }
  })
)
app.use(cors())

const uploadUrl =
  'http://localhost:3001/public/upload'

router.get('/', (ctx) => {
  // 设置头类型, 如果不设置，会直接下载该页面
  ctx.type = 'html'
  // 读取文件
  const pathUrl = path.join(
    __dirname,
    '/public/edit.html'
  )
  ctx.body = fs.createReadStream(pathUrl)
})

// 上传文件
router.post('/upload', (ctx) => {
  const file = ctx.request.files.file
  console.log(file)
  // 读取文件流
  const fileReader = fs.createReadStream(
    file.filepath
  )
  console.log(fileReader)
  const filePath = path.join(
    __dirname,
    '/public/upload/'
  )
  const ext = file.originalFilename.split('.')[1]
  // 组装成绝对路径
  const fileResource =
    filePath + `/${file.newFilename}.${ext}`

  /*
   使用 createWriteStream 写入数据，然后使用管道流pipe拼接
  */
  const writeStream =
    fs.createWriteStream(fileResource)
  const res = {
    url:
      uploadUrl + `/${file.newFilename}.${ext}`,
    code: 0,
    message: '上传成功'
  }
  // 判断 /public/upload 文件夹是否存在，如果不在的话就创建一个
  if (!fs.existsSync(filePath)) {
    fs.mkdir(filePath, (err) => {
      if (err) {
        throw new Error(err)
      } else {
        fileReader.pipe(writeStream)
        ctx.body = res
      }
    })
  } else {
    fileReader.pipe(writeStream)
    ctx.body = res
  }
})

app.use(static(path.join(__dirname)))

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(3001, () => {
  console.log(
    'server is listen in 3001， page at http://localhost:3001'
  )
})
