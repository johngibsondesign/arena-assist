# Prismatic Items Database Schema Documentation

## Table: `arena_prismatic_items`

### Purpose
Stores tier list rankings of prismatic items for each champion in Arena mode. This allows the application to display champion-specific tier lists for prismatic items, helping players understand which items work best with each champion.

### Table Structure

```sql
CREATE TABLE arena_prismatic_items (
    id SERIAL PRIMARY KEY,
    champion_id VARCHAR(50) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    image_url TEXT,
    tier_rank VARCHAR(1) NOT NULL CHECK (tier_rank IN ('S', 'A', 'B', 'C', 'D')),
    tier_position INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    effect_summary TEXT,
    usage_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Column Details

| Column | Type | Required | Description | Data Gatherer Usage |
|--------|------|----------|-------------|-------------------|
| `id` | SERIAL | Yes | Auto-incrementing primary key | Not needed for data gathering |
| `champion_id` | VARCHAR(50) | Yes | League champion identifier (e.g., "Jinx", "Yasuo") | **Map champion name to this field** |
| `item_name` | VARCHAR(100) | Yes | Name of the prismatic item | **Your item name goes here** |
| `image_url` | TEXT | No | URL to the item image from Riot CDN | **Your image URL goes here** |
| `tier_rank` | VARCHAR(1) | Yes | Tier ranking: S=Best, A=Great, B=Good, C=Average, D=Poor | **Your tier goes here** |
| `tier_position` | INTEGER | Yes | Position within the tier (1=highest, 2=second, etc.) | Calculate based on ranking |
| `description` | TEXT | No | Full description of the item | Optional - can be gathered from Riot API |
| `effect_summary` | TEXT | No | Brief summary of item effect | Optional - simplified description |
| `usage_notes` | TEXT | No | Notes on when/how to use this item | Optional - strategic notes |
| `updated_at` | TIMESTAMP | Auto | Automatic timestamp | Handled by database |

### Constraints and Indexes

- **Unique constraint**: `(champion_id, item_name)` - Prevents duplicate items per champion
- **Unique constraint**: `(champion_id, tier_rank, tier_position)` - Prevents duplicate positions within a tier
- **Check constraint**: `tier_rank` must be one of 'S', 'A', 'B', 'C', 'D'
- **Index**: `champion_id` for fast champion lookups
- **Index**: `tier_rank` for tier filtering
- **Index**: `(champion_id, tier_rank)` for champion-tier combinations

## Data Gatherer Integration Guide

### Required Fields for Your Data Gatherer
Based on your requirements, you need to gather:

1. **Item Name** → `item_name` column
2. **Image URL** → `image_url` column  
3. **Tier** → `tier_rank` column

### Data Format Expected

```json
{
  "champion_id": "Jinx",
  "item_name": "Deathblade",
  "image_url": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png",
  "tier_rank": "S",
  "tier_position": 1
}
```

### Sample Data Structure for Each Champion

```json
{
  "champion": "Jinx",
  "prismatic_items": [
    {
      "name": "Deathblade",
      "image": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/6673.png",
      "tier": "S",
      "position": 1
    },
    {
      "name": "Infinity Edge", 
      "image": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/3031.png",
      "tier": "S",
      "position": 2
    },
    {
      "name": "Runaans Hurricane",
      "image": "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/3085.png", 
      "tier": "A",
      "position": 1
    }
  ]
}
```

### API Endpoints Available

The application provides these methods for managing prismatic items:

- `getPrismaticItemsByChampion(championId)` - Get all items for a champion
- `getPrismaticItemsByTier(tier)` - Get all items in a specific tier
- `addPrismaticItem(item)` - Add a new item
- `updatePrismaticItem(id, updates)` - Update an existing item
- `deletePrismaticItem(id)` - Delete an item

### Data Population Script Example

```javascript
// Example function to populate prismatic items
async function populatePrismaticItems(championData) {
  for (const champion of championData) {
    for (let i = 0; i < champion.prismatic_items.length; i++) {
      const item = champion.prismatic_items[i];
      
      await supabaseService.addPrismaticItem({
        champion_id: champion.champion,
        item_name: item.name,
        image_url: item.image,
        tier_rank: item.tier,
        tier_position: item.position || (i + 1)
      });
    }
  }
}
```

### Champion Name Mapping

Ensure your data gatherer uses the correct champion identifiers. These should match the champion IDs used in other parts of the database:

- Use PascalCase (e.g., "MasterYi", "AurelionSol", "KogMaw")
- No spaces or special characters
- Match Riot's champion identifiers

### Image URL Format

Prismatic item images should follow Riot's CDN pattern:
```
https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{itemId}.png
```

Where:
- `{version}` is the current patch version (e.g., "14.1.1")
- `{itemId}` is the item's ID from Riot's API

### Tier System

The tier system uses a simple S-A-B-C-D ranking:
- **S Tier**: Best in slot, core items that define the champion
- **A Tier**: Excellent items, strong in most situations  
- **B Tier**: Good items, situationally powerful
- **C Tier**: Average items, niche use cases
- **D Tier**: Poor items, rarely optimal

### Data Validation

When gathering data, ensure:
1. All tier ranks are uppercase single letters (S, A, B, C, D)
2. Item names are consistent and match in-game names
3. Champion IDs match the existing database format
4. Tier positions start at 1 and increment sequentially
5. Image URLs are valid and accessible

This schema provides flexibility for rich tier list data while maintaining the core requirement of name, image, and tier for each champion's prismatic items.
