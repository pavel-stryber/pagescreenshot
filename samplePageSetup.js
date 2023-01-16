// It's a sample of page setup script.
// With page object of puppeteer Page class you can make some page manipulations
// before making screenshots. For example hide cookies acceptance alert or
// add some extra styles
module.exports = async ({ page }) => {
  // await page.addStyleTag({ path: './styles.css' });
  await page.addStyleTag({
    content: 'video {\n' +
    '    background-color: black\n' +
    '}',
  });
  const [button] = await page.$x("//button[contains(., 'Sounds good')]");
  await button.click();
};
