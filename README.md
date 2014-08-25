### TODO

- smoothly scroll into/out of image data rather than recomputing every time
    - research map zoom tile load/cache
    - use hash in url to link to zoom level and center

- use webworkers or webGL to recompute without hanging UI thread

- find breakpoint for BigDecimal usage and sequence length increase
    - don't try and parametrize this.  just dig in and hardcode based on what you see

- accept tiles from clients by PUT into server db

- try to get tiles from server before computing them
