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
