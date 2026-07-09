import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SeriesConfig {
  key: string;
  stroke: string;
  fill?: string;
  fillOpacity?: number;
  dashed?: boolean;
  yAxisId?: string;
}

interface ChartCardProps {
  title: string;
  type: 'area' | 'line';
  data: any[];
  series: SeriesConfig[];
  yAxisRight?: boolean;
  showCard?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border p-2.5 rounded-md shadow-md text-xs font-mono select-none">
        <p className="font-semibold mb-1 text-foreground">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="tabular-nums" style={{ color: p.stroke }}>
            {p.name}: {p.value}
            {p.name.includes('Rate') || p.name.includes('success') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  series,
  yAxisRight = false,
  showCard = true,
}) => {
  const isArea = type === 'area';

  const chartBlock = (
    <div className="h-[280px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        {isArea ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="oklch(0.92 0 0)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.44 0 0)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="oklch(0.44 0 0)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s, idx) => (
              <Area
                key={s.key || idx}
                type="monotone"
                dataKey={s.key}
                stroke={s.stroke}
                strokeWidth={1.5}
                fill={s.fill || s.stroke}
                fillOpacity={s.fillOpacity ?? 0.08}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: yAxisRight ? -15 : 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" stroke="oklch(0.92 0 0)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="oklch(0.44 0 0)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="oklch(0.44 0 0)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            {yAxisRight && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="oklch(0.44 0 0)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            {series.map((s, idx) => (
              <Line
                key={s.key || idx}
                yAxisId={s.yAxisId || 'left'}
                type="monotone"
                dataKey={s.key}
                stroke={s.stroke}
                strokeWidth={1.5}
                strokeDasharray={s.dashed ? '5 5' : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );

  if (!showCard) {
    return (
      <div className="w-full min-w-0">
        <h3 className="text-[13.5px] font-medium text-foreground mb-4 select-none">
          {title}
        </h3>
        {chartBlock}
      </div>
    );
  }

  return (
    <Card className="bg-card border-border rounded-md shadow-none w-full min-w-0">
      <CardHeader className="p-5 pb-0 select-none">
        <CardTitle className="text-[14px] font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        {chartBlock}
      </CardContent>
    </Card>
  );
};
