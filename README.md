# VuePencil

> **An experiment.** VuePencil explores an idea and isn't a maintained tool. Expect rough edges, missing features, and breaking changes, and don't build on it.

VuePencil is a Figma-like editor in which the design *is* a Vue component. You arrange real components on a canvas, and the result serializes to an ordinary `.vue` single-file component that runs.

It's one direction of [OpenPencil](https://github.com/open-pencil/open-pencil), and the post [What I've Been Building This Year](https://dannote.net/writing/what-ive-been-building-this-year/) explains where it fits.

## The idea

The VNode tree is the single source of truth. Editor tools never touch the DOM: moving, resizing, or restyling something changes the tree, Vue renders it into the canvas, and the editor reads the rendered geometry back to place selections and handles. [`DESIGN.md`](DESIGN.md) describes the architecture.

Because the canvas holds real components, a switch isn't a rectangle that looks like a switch. It stays a Reka UI `SwitchRoot` with a `SwitchThumb`, and it behaves like one in preview.

## What works

- **Components:** Reka UI primitives, including Switch, Checkbox, Slider, Progress, Tabs, Accordion, and Collapsible, and a Card with header, body, and footer slots.
- **Slots and props:** components expose named slots you can drop content into, and their props can be edited.
- **Capabilities:** VueUse composables appear as visual capabilities, such as Dark mode, Persist value, Track size, and Make draggable. Their values can be bound to properties and text. [`docs/VUEUSE_WYSIWYG_PLAN.md`](docs/VUEUSE_WYSIWYG_PLAN.md) has the plan.
- **Export:** a design serializes to a Vue SFC. Frames and canvas positions stay editor metadata instead of leaking into component CSS, slots become Vue slots, capabilities become composable calls, and bindings become Vue expressions.

## What doesn't

Most of an editor. There's no persistence, no `.fig` import, and no collaboration. The component library is small and hard-coded, and only the main flows have been exercised.

## Running it

```sh
bun install
bun dev          # the editor
bun run test     # unit tests
bun run check    # type checking
```
