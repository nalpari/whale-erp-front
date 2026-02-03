import Link from 'next/link'

const routes = [
  { path: '/storybook/datepicker', name: 'DatePicker' },
  { path: '/storybook/editor', name: 'Editor' },
  { path: '/storybook/image-upload', name: 'Image Upload' },
  { path: '/storybook/input', name: 'Input' },
  { path: '/storybook/postcode', name: 'Postcode' },
  { path: '/storybook/radio', name: 'Radio' },
  { path: '/storybook/search-select', name: 'Search Select' },
  { path: '/storybook/upload', name: 'Upload' },
]

export default function StorybookIndexPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Storybook Components</h1>
      <ul className="space-y-2">
        {routes.map((route) => (
          <li key={route.path}>
            <Link href={route.path} className="text-blue-600 hover:underline">
              {route.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
