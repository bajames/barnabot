# map-poster

Generate beautiful minimalist map posters for any city using OpenStreetMap data.

## Usage

```
/map-poster <city>, <country> [options]
```

## Examples

```
/map-poster San Francisco, USA
/map-poster Paris, France --theme midnight
/map-poster Tokyo, Japan --distance 25000 --all-themes
```

## Options

- `--theme <name>` or `-t <name>`: Choose from 17 themes (default: terracotta)
  Available themes: terracotta, midnight, ocean, forest, sunset, monochrome, pastel, vibrant, earth, sky, rose, mint, lavender, coral, sage, slate, amber
- `--distance <meters>` or `-d <meters>`: Map radius in meters (default: 18000)
- `--width <inches>` or `-W <inches>`: Poster width in inches (default: 24)
- `--height <inches>` or `-H <inches>`: Poster height in inches (default: 36)
- `--all-themes`: Generate posters in all 17 themes
- `--dpi <value>`: Resolution in DPI (default: 300)

## How it works

1. Installs dependencies if needed
2. Fetches OpenStreetMap data for the city
3. Generates poster(s) with customizable themes
4. Saves to `posters/` directory with timestamp
5. Returns the file path(s) for download

## Output

Posters are saved as high-resolution PNG files in `/workspace/group/maptoposter/posters/`
