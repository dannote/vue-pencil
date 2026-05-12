# VueUse as WYSIWYG Capabilities

VueUse should not appear to end users as a list of composables. In VuePencil it should appear as visual capabilities that expose typed values and actions which can be bound to properties, text, variants, and interactions.

## User model

Users add capabilities such as:

- Dark mode
- Persist value
- Track element size
- Make draggable
- Track cursor
- Copy to clipboard
- Responsive breakpoint

The editor maps those capabilities to VueUse composables during code generation.

## Core abstraction

```txt
VueUse composable → capability → typed outputs/actions → visual bindings → generated SFC
```

A capability can be component-scoped or attached to a specific element.

Examples:

- Dark mode: component-scoped writable boolean output, generated from `useDark()`.
- Local storage state: component-scoped writable ref, generated from `useLocalStorage(key, initialValue)`.
- Element size: element-scoped readonly numeric outputs, generated from `useElementSize(targetRef)`.
- Draggable: element-scoped behavior with `x`, `y`, and `style`, generated from `useDraggable(targetRef)`.

## Binding UX

Every editable value should eventually have a bind control:

```txt
Width       [320 px]   Bind
Opacity     [100%]     Bind
Text        [Hello]    Bind
Visible     [Always]   Bind
```

The binding picker lists semantic values:

```txt
State
  email
  isOpen

Capabilities
  Dark mode enabled
  Card width
  Card height
  Drag X
  Drag Y

Server props
  user.name
  contacts.length
```

## Phoenix Vapor compatibility

Most VueUse capabilities are client/browser capabilities. They should be marked as requiring Phoenix Vapor hybrid/client mode. Server-only export should either reject them or offer fixes.

```txt
Cannot export server-only:
- Input.email uses Browser Local Storage
- Card uses Draggable
- Layout uses Window Size

Fixes:
- Convert to server prop
- Remove capability
- Export as Hybrid
```

## Initial implementation slice

Implement four capabilities because they cover the important return shapes:

1. Dark mode — writable computed boolean.
2. Local storage — writable persisted ref.
3. Element size — element-scoped object of refs.
4. Draggable — element-scoped behavior returning position and style.

These force the model to handle global capabilities, element targets, object-of-refs, refs in generated templates, and runtime behavior vs editor behavior.
