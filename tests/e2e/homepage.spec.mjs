import { test, expect } from './fixtures.mjs'

test('phone homepage keeps links usable without downloading decorative video',async({page},testInfo)=>{
  test.skip(Boolean(process.env.E2E_CDP_URL),'Do not resize the shared managed browser.')
  await page.setViewportSize({width:390,height:844})
  const videoRequests=[]
  page.on('request',request=>{if(request.url().includes('/HeroBack.mp4'))videoRequests.push(request.url())})
  await page.goto('/')
  await expect(page.getByRole('heading',{name:/Freelance and Side Hustle Ecosystem/})).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('video')).toHaveCount(0)
  expect(videoRequests).toHaveLength(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
  await page.screenshot({path:testInfo.outputPath('homepage-phone.png'),fullPage:true})
  await page.getByRole('link',{name:'Find Work',exact:true}).click()
  await expect(page.getByLabel('Email address')).toBeVisible()
})

test('reduced-motion desktop uses the poster and preserves the login destination',async({page},testInfo)=>{
  test.skip(Boolean(process.env.E2E_CDP_URL),'Do not change shared managed-browser media settings.')
  await page.setViewportSize({width:1440,height:900})
  await page.emulateMedia({reducedMotion:'reduce'})
  const videoRequests=[]
  page.on('request',request=>{if(request.url().includes('/HeroBack.mp4'))videoRequests.push(request.url())})
  await page.goto('/')
  await expect(page.getByRole('heading',{name:/Freelance and Side Hustle Ecosystem/})).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('video')).toHaveCount(0)
  expect(videoRequests).toHaveLength(0)
  await page.screenshot({path:testInfo.outputPath('homepage-desktop-reduced-motion.png'),fullPage:true})
  await page.getByRole('link',{name:'Post a Job',exact:true}).click()
  await expect(page.getByLabel('Email address')).toBeVisible()
})
