/**
 * Shared layout for the labelled form rows in this directory.
 *
 * Every field used to hardcode a pixel width (`w-[13rem]`) inside a
 * non-wrapping flex row, which overflowed the viewport on phones. The rule
 * is: stack label above control when the column is narrow, pair them when it
 * is wide.
 *
 * These are CONTAINER queries (`@xl:`), not viewport queries. The form is a
 * ~420px rail on a 1440px desktop, so a viewport-based `sm:` would fire there
 * and lay a two-column grid into a column too narrow to hold it. `@xl` is
 * 576px of container, which reproduces exactly what `sm:` (640px viewport,
 * ~592px of container) did before: phones and the desktop rail stack, tablets
 * and a full-width column pair.
 *
 * IMPORTANT: the stacked branch is what phones get and is signed off. It must
 * not change.
 */

/*
 * From `sm` up this is a two-column grid rather than a flex row with
 * `justify-between`.
 *
 * The old row pushed a fixed 13rem control hard against the right edge and let
 * the label absorb all the slack, so a short label sat a long way from its
 * value — the pair read as two separate columns, a label rail and a control
 * rail, which is a large part of why the form felt like a dense table. A grid
 * keeps the value next to its label at any label length.
 */
export const fieldRow = [
    "flex flex-col gap-1.5 text-sm",
    /*
     * Inside the desktop rail the row pairs up rather than stacking, even
     * though the column is only ~420px. A stacked row is ~78px; paired it is
     * ~46px, which is the difference between a step you scroll and a step you
     * see.
     *
     * Two conditions, and both are needed:
     *
     * `shell:` — because width alone cannot tell the cases apart. A 430px
     * phone's form column and the rail at a 1280px viewport are within a few
     * pixels of each other, and one must stack while the other pairs.
     *
     * `@[20rem]:` — because the rail is not always the container. Bill From
     * and Bill To sit side by side in the shell, each its own `@container` at
     * ~190px, where a 7rem label beside its input would leave a ~76px field.
     * Those halves fall back to stacked; the full rail (~395px and up) pairs.
     */
    "shell:@[20rem]:grid shell:@[20rem]:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] shell:@[20rem]:items-center shell:@[20rem]:gap-3",
    // Above the rail width, back to the proportional pairing.
    "@xl:grid @xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] @xl:items-center @xl:gap-4",
].join(" ");

/** Control column: fluid on mobile, the grid's second track from sm up. */
export const fieldControl = "w-full min-w-0";

/** Wider variant, kept for textareas that want the full row. */
export const fieldControlWide = "w-full min-w-0";

/** Label column: the grid's first track from sm up. */
export const fieldLabel = "min-w-0";
