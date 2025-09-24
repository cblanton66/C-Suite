"use client"

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface ChartData {
  type: 'line' | 'bar' | 'pie'
  title: string
  data: any[]
  xKey?: string
  yKey?: string
  description?: string
}

interface ChartRendererProps {
  chartData: ChartData
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']

export function ChartRenderer({ chartData }: ChartRendererProps) {
  const { type, title, data, xKey = 'name', yKey = 'value', description } = chartData

  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey={yKey} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
      
      default:
        return <div className="text-sm text-muted-foreground">Unsupported chart type: {type}</div>
    }
  }

  return (
    <div className="my-6 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {renderChart()}
    </div>
  )
}

export function parseChartFromText(content: string): ChartData | null {
  const chartMatch = content.match(/```chart\s*\n([\s\S]*?)\n```/)
  
  if (!chartMatch) return null
  
  try {
    const chartData = JSON.parse(chartMatch[1])
    
    // Validate required fields
    if (!chartData.type || !chartData.title || !chartData.data) {
      return null
    }
    
    // Validate chart type
    if (!['line', 'bar', 'pie'].includes(chartData.type)) {
      return null
    }
    
    return chartData as ChartData
  } catch (error) {
    console.error('Error parsing chart data:', error)
    return null
  }
}