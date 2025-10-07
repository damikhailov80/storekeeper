import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Storekeeper</h1>
        <p className="text-gray-600 mb-8">
          Система управления складом с функцией сканирования штрихкодов
        </p>
        <div className="space-y-4">
          <Button variant="primary" size="lg" className="w-full">
            Начать сканирование
          </Button>
          <Button variant="outline" size="md" className="w-full">
            Просмотр товаров
          </Button>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Next.js 14 • TypeScript • Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
