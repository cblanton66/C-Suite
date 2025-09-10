"use client"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartData {
  type: 'line' | 'bar' | 'pie'
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
  colors?: string[]
}

interface ChartRendererProps {
  chartData: ChartData
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']

export function ChartRenderer({ chartData }: ChartRendererProps) {
  const { type, title, data, xAxis, yAxis, colors = COLORS } = chartData

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yAxis || 'value'} stroke={colors[0]} strokeWidth={2} />
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis || 'name'} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yAxis || 'value'} fill={colors[0]} />
          </BarChart>
        )
      
      case 'pie':
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )
      
      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <div className="w-full bg-card border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

// Helper function to parse simple chart data from text
export function parseChartFromText(text: string): ChartData | null {
  // Look for patterns like:
  // CHART:BAR:Revenue by Month
  // January: 100000
  // February: 120000
  // March: 110000
  
  const chartMatch = text.match(/CHART:(LINE|BAR|PIE):(.+?)\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i)
  if (!chartMatch) return null

  const [, type, title, dataText] = chartMatch
  const lines = dataText.trim().split('\n')
  const data = []

  for (const line of lines) {
    const match = line.match(/^(.+?):\s*([0-9,.]+)/)
    if (match) {
      const [, name, value] = match
      data.push({
        name: name.trim(),
        value: parseFloat(value.replace(/,/g, ''))
      })
    }
  }

  if (data.length === 0) return null

  return {
    type: type.toLowerCase() as 'line' | 'bar' | 'pie',
    title: title.trim(),
    data,
    xAxis: 'name',
    yAxis: 'value'
  }
}