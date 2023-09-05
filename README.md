# ZenAPI

## Technical Overview

### Entity

An entity is a object that you can attach a resolver on the backend.

### Instance

An instance contains an entity, a payload and optionally a parent.
When an instance has a parent, the parent is resolved first.
Calling `next()` in a resolver will try to resolve the child of the current instance.

### Schema

The schema is the top level instance.
