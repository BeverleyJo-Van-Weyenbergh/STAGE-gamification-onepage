import officeImage from '@/assets/Icon.png'

export interface OfficeRecord {
  id: string
  name: string
  image: string
  // Coordinates are [longitude, latitude]
  coordinates: [number, number]
}

export interface OfficeDatabaseEntry {
  name: string
  lat: number
  lng: number
  image?: string
}

// Update this list with your own offices.
export const officeDatabase: OfficeDatabaseEntry[] = [
  { name: 'Roeselare', image: 'roeselare.jpg', lat: 50.9466, lng: 3.1223 },
  { name: 'Brugge', image: 'brugge.jpg', lat: 51.143, lng: 3.183 },
  { name: 'Knokke', image: 'knokke.jpg', lat: 51.335, lng: 3.276 },
  { name: 'Kortrijk', image: 'kortrijk.jpg', lat: 50.8249, lng: 3.264 },
  { name: 'Waregem', image: 'waregem.jpg', lat: 50.8895, lng: 3.4306 },
  { name: 'Gent', image: 'gent.jpg', lat: 51.0389, lng: 3.7164 },
  { name: 'Wetteren', image: 'wetteren.jpg', lat: 51.0006, lng: 3.882 },
  { name: 'Lokeren', image: 'lokeren.jpg', lat: 51.1027, lng: 3.9866 },
  { name: 'Ieper', image: 'ieper.jpg', lat: 50.8509, lng: 2.8851 },
  { name: 'Oostende', image: 'oostende.jpg', lat: 51.2143, lng: 2.9252 },
  { name: 'Aalter', image: 'aalter.jpg', lat: 51.0833, lng: 3.45 },
  { name: 'Tielt', image: 'tielt.jpg', lat: 50.9996, lng: 3.326 },
]

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const offices: OfficeRecord[] = officeDatabase.map((office) => ({
  id: slugify(office.name),
  name: office.name,
  image: office.image ?? officeImage,
  coordinates: [office.lng, office.lat],
}))
