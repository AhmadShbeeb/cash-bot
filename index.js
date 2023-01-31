require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { webhookCallback } = require('grammy')
const bot = require('./src/bot')

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(webhookCallback(bot, 'express', 'throw', '60000'))

app.listen(process.env.PORT)
module.exports = app
