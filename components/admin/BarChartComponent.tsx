"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface WeeklySalesData {
  day: string;
  dayName: string;
  sales: number;
  orders: number;
  date: string;
}

interface WeeklySalesResponse {
  data: WeeklySalesData[];
  totalSales: number;
  totalOrders: number;
  weekGrowth: number;
  bestDay: {
    day: string;
    sales: number;
  };
}

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "#78f3d3",
  },
} satisfies ChartConfig

export function BarChartComponent() {
  const [weeklyData, setWeeklyData] = useState<WeeklySalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeeklySales() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard/weekly-sales');
        
        if (!response.ok) {
          throw new Error('Error al cargar datos de ventas semanales');
        }
        
        const data = await response.json();
        setWeeklyData(data);
      } catch (err) {
        console.error('Error fetching weekly sales:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklySales();
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ventas de la Semana</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#78f3d3]" />
            <p className="text-s text-gray-500">Cargando datos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ventas de la Semana</CardTitle>
          <CardDescription>Últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-red-500 mb-2 text-sm">Error al cargar datos</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-s text-[#78f3d3] hover:underline"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weeklyData) {
    return null;
  }

  const chartData = weeklyData.data.map(item => ({
    day: formatDate(item.date),
    sales: item.sales,
    orders: item.orders,
    fullDate: item.date
  }));

  const isGrowthPositive = weeklyData.weekGrowth >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Ventas de la Semana</CardTitle>
        <CardDescription className="text-sm">
          Total: {formatCurrency(weeklyData.totalSales)} • {weeklyData.totalOrders} órdenes
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e6e5" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#6c7a89' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#6c7a89' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(120, 243, 211, 0.1)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-medium text-[#313D52] text-sm">{label}</p>
                      <p className="text-[#78f3d3] font-semibold text-sm">
                        Ventas: {formatCurrency(data.sales)}
                      </p>
                      <p className="text-s text-[#6c7a89]">
                        {data.orders} {data.orders === 1 ? 'orden' : 'órdenes'}
                      </p>
                      <p className="text-s text-[#6c7a89] mt-1">
                        {new Date(data.fullDate).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="sales" 
              fill="#78f3d3" 
              radius={[2, 2, 0, 0]}
              stroke="#4de0c0"
              strokeWidth={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-3 text-s pt-2">
        <div className="flex gap-2 font-medium leading-none items-center">
          {isGrowthPositive ? (
            <>
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">
                {weeklyData.weekGrowth > 0 ? `+${weeklyData.weekGrowth.toFixed(1)}%` : 'Sin cambio'}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-600">
                {weeklyData.weekGrowth.toFixed(1)}%
              </span>
            </>
          )}
          <span className="text-[#6c7a89]">vs semana anterior</span>
        </div>
        <div className="leading-none text-muted-foreground">
          Mejor día: <span className="font-medium text-[#313D52]">
            {weeklyData.bestDay.day} ({formatCurrency(weeklyData.bestDay.sales)})
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}