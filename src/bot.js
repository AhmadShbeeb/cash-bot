const { Deta } = require('deta')
const deta = Deta(process.env.DETA_PROJECT_KEY)
const { Bot, InlineKeyboard, Keyboard } = require('grammy')

const bot = new Bot(process.env.BOT_TOKEN)
const User = deta.Base('cash-bot-users')

const MAIN_MENU = ['تحويل رصيد', 'حسابي', 'حول البوت', 'تواصل معنا']
const RETURN_TO_MAIN_MENU = ['رجوع', 'القائمة الرئيسية']
const CHARGE_MENU = ['2', '3', 'رجوع', 'القائمة الرئيسية']
const POINTS_MENU = ['3000 وحدة', '5000 وحدة', '10000 وحدة', 'رجوع', 'القائمة الرئيسية']
const IMAGES = [
  'https://res.cloudinary.com/ds5w9lrch/image/upload/v1675197079/mtn_syriatel_muuw3q.jpg',
  'https://res.cloudinary.com/ds5w9lrch/image/upload/v1675197079/mtn_obzbdi.jpg',
  'https://res.cloudinary.com/ds5w9lrch/image/upload/v1675197079/syriatel_yc6mvz.jpg',
  'https://res.cloudinary.com/ds5w9lrch/image/upload/v1675197562/sticker_dlfh5x.webp',
]

bot.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.log({ error })
  }
})

bot.command('start', async ctx => {
  const senderId = ctx?.message?.from?.id
  const userName = ctx?.message?.from?.username
  const firstName = ctx?.message?.from?.first_name

  await bot.api.sendMessage(
    senderId,
    `مرحبا [${firstName}](tg://user?id=${senderId}) \n\n اسم الحساب [${userName}](tg://user?id=${senderId}) \n\n المعرف ${senderId}`,
    {
      parse_mode: 'Markdown',
    }
  )

  const keyboard = new Keyboard()
  for (let i = 0; i < MAIN_MENU.length; i++) {
    if (i < MAIN_MENU.length - 2) {
      keyboard.text(MAIN_MENU[i]).row()
    } else {
      keyboard.text(MAIN_MENU[i])
    }
  }
  keyboard.resized()

  const optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_notification: true,
  }
  await ctx.reply(`القائمة الرئيسية`, optionalParams)

  await User.insert(
    {
      id: senderId,
      userName: ctx.message?.from?.username,
      firstLastName: ctx.message?.from?.first_name + ctx.message?.from?.last_name,
      createdAt: Date(),
    },
    senderId.toString()
  )
})

bot.on('message:text').hears(MAIN_MENU, async ctx => {
  const selectedMenu = ctx?.match
  const userName = ctx?.message?.from?.username
  const senderId = ctx?.message?.from?.id

  if (selectedMenu === MAIN_MENU[0]) {
    //transfer points
    const inlineKeyboard = new InlineKeyboard().text('MTN', 'mtn_points').text('Syriatel', 'syriatel_points').row()
    const optionalParams = {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
      disable_notification: true,
      caption: 'اختر النوع',
    }
    await ctx.replyWithPhoto(IMAGES[0], optionalParams)
  } else if (selectedMenu === MAIN_MENU[1]) {
    // my account
    const inlineKeyboard = new InlineKeyboard().text('اشحن حسابك', 'account_charge').row()
    const optionalParams = {
      parse_mode: 'Markdown',
      reply_markup: inlineKeyboard,
      disable_notification: true,
    }
    await ctx.reply(
      `الاسم:  [${userName}](tg://user?id=${senderId})  \n\n الكود: ${123} \n\n رصيدك: ${0} ل.س`,
      optionalParams
    )
  } else if (selectedMenu === MAIN_MENU[2]) {
    // about-bot
    let res = await User.fetch()
    let allItems = res.items
    // continue fetching until last is not seen
    while (res.last) {
      res = await User.fetch({}, { last: res.last })
      allItems = allItems.concat(res.items)
    }
    await ctx.reply(`المستخدمين في البوت ${allItems.length}`)
  } else if (selectedMenu === MAIN_MENU[3]) {
    // contact-us
    await ctx.reply(MAIN_MENU[3])
  }
})

bot.callbackQuery('account_charge', async ctx => {
  const keyboard = new Keyboard()
  for (let i = 0; i < CHARGE_MENU.length; i++) {
    if (i < CHARGE_MENU.length - 2) {
      keyboard.text(CHARGE_MENU[i]).row()
    } else {
      keyboard.text(CHARGE_MENU[i])
    }
  }
  keyboard.resized()

  const optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_notification: true,
  }
  await ctx.replyWithSticker(IMAGES[3], optionalParams)

  await ctx.answerCallbackQuery() // remove loading animation
})

bot.callbackQuery(['mtn_points', 'syriatel_points'], async ctx => {
  const selectedProvider = ctx?.match
  const providerImage = selectedProvider === 'mtn_points' ? IMAGES[1] : IMAGES[2]

  const keyboard = new Keyboard()
  for (let i = 0; i < POINTS_MENU.length; i++) {
    if (i < POINTS_MENU.length - 2) {
      keyboard.text(POINTS_MENU[i]).row()
    } else {
      keyboard.text(POINTS_MENU[i])
    }
  }
  keyboard.resized()

  const optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_notification: true,
  }
  await ctx.replyWithPhoto(providerImage, optionalParams)

  await ctx.answerCallbackQuery() // remove loading animation
})

//must be before CHARGE_MENU && POINTS_MENU
bot.on('message:text').hears(RETURN_TO_MAIN_MENU, async ctx => {
  // return || main menu
  const keyboard = new Keyboard()
  for (let i = 0; i < MAIN_MENU.length; i++) {
    if (i < MAIN_MENU.length - 2) {
      keyboard.text(MAIN_MENU[i]).row()
    } else {
      keyboard.text(MAIN_MENU[i])
    }
  }
  keyboard.resized()

  const optionalParams = {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_notification: true,
  }
  await ctx.reply(`القائمة الرئيسية`, optionalParams)
})

bot.on('message:text').hears(CHARGE_MENU, async ctx => {
  const selectedMenu = ctx?.match
  if (selectedMenu !== RETURN_TO_MAIN_MENU[0] || selectedMenu !== RETURN_TO_MAIN_MENU[1]) await ctx.reply(selectedMenu)
})

bot.on('message:text').hears(POINTS_MENU, async ctx => {
  const selectedMenu = ctx?.match

  if (selectedMenu !== RETURN_TO_MAIN_MENU[0] || selectedMenu !== RETURN_TO_MAIN_MENU[1]) {
    // points
    await ctx.reply(
      `ان قيمة ${selectedMenu} هي ${
        parseInt(selectedMenu.match(/\d+/)[0]) + 500
      } ل.س \n\n عذرا ان رصيد حسابك ${0} ل.س \n\n يرجى شحن حسابك `
    )
  }
})

bot.on('message', async ctx => {
  await ctx.reply(`أمر خاطئ يرجى ضغط \n /start`)
})

module.exports = bot
