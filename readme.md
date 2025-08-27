## Chess Opening Trainer

This is a multi-course, data-driven chess opening trainer application.

### Technical Decisions & Notes

A few non-standard approaches were taken for pragmatic reasons:

#### Chessground Board Theming

The visual theme for the chessboard (i.e., the light and dark square colors) is not set in the project's main `styles.css` file. Due to quirks and CSS specificity challenges with the Chessground library, the theme has been set by **directly modifying a library file**.

-   **Modified File:** `/assets/css/chessground.brown.css`
-   **Modification:** The color values within this file have been changed from the default brown to a custom blue theme.

**Warning:** If you ever update the Chessground library, this file will likely be overwritten. The custom theme will need to be re-applied manually. Please see the comments in `trainer.html` and at the top of the CSS file for more details.