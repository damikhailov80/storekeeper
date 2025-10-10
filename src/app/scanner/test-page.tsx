'use client';

import { Button } from '@/components/ui/button';

export default function TestPage() {
  const handleClick = () => {
    console.log('Button clicked!');
    alert('Кнопка работает!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Тест кнопки</h1>
        <Button onClick={handleClick} variant="primary" size="lg" className="w-full">
          Нажми меня
        </Button>
      </div>
    </div>
  );
}
