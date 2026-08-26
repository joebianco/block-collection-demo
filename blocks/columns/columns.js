export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // explicit hs-background-color/hs-text-color attributes take precedence
  // over the hs-brand-theme CSS, so apply them as inline styles which
  // naturally win the cascade over the theme's attribute-selector rules
  const section = block.closest('.section');
  if (section) {
    const {
      hsBackgroundColor, hsTextColor, hsButtonBackgroundColor, hsButtonTextColor,
    } = section.dataset;
    // use the `background` shorthand rather than `background-color` since
    // hsBackgroundColor may be a solid color or a gradient() function, and
    // `background-color` silently rejects gradients
    if (hsBackgroundColor) section.style.background = hsBackgroundColor;
    if (hsTextColor) section.style.color = hsTextColor;
    if (hsButtonBackgroundColor || hsButtonTextColor) {
      section.querySelectorAll('.button-container .button').forEach((button) => {
        if (hsButtonBackgroundColor) button.style.background = hsButtonBackgroundColor;
        if (hsButtonTextColor) button.style.color = hsButtonTextColor;
      });
    }
  }
}
