import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Sparkles, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { supabase } from '../../supabase';

const GEMINI_API_KEY = "ВАШ_КЛЮЧ"; // Ключ должен быть в .env в реальности

const AIVetScreen = ({ route, navigation }: any) => {
  const { animal } = route.params;
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    try {
      const { data: locs } = await supabase
        .from('animal_locations')
        .select('*')
        .eq('animal_id', animal.id)
        .gte('timestamp', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (!locs || locs.length < 2) {
        setAnalysis({
          status: 'warning',
          title: 'Мало данных',
          analysis: 'Для точного анализа нужно больше перемещений за последние 6 часов.',
          recommendation: 'Подождите накопления истории или проверьте активность животного.'
        });
        setLoading(false);
        return;
      }

      // Calculate metrics for AI
      let totalDist = 0;
      let totalSpeed = 0;
      let activePoints = 0;
      let speeds = [];

      for (let i = 1; i < locs.length; i++) {
        const d = getDistance(locs[i-1].lat, locs[i-1].lon, locs[i].lat, locs[i].lon);
        totalDist += d;
        const s = locs[i].speed || 0;
        totalSpeed += s;
        speeds.push(s);
        if (s > 0.1) activePoints++;
      }

      const avgSpeed = (totalSpeed / locs.length).toFixed(2);
      const maxSpeed = Math.max(...speeds).toFixed(2);
      const activeHours = (activePoints * 5 / 60).toFixed(1);
      const speedVariance = calculateVariance(speeds).toFixed(2);
      const totalDistKm = (totalDist / 1000).toFixed(2);

      const prompt = `You are an expert veterinarian AI. 
Analyze historical movement for a ${animal.type}. 
IMPORTANT: Adjust assessent based on ${animal.type} norms.
Respond ONLY in JSON:
{
  "status": "ok" | "warning" | "alert",
  "title": "short title in Russian",
  "analysis": "2-3 sentences in Russian explaining status for a ${animal.type}",
  "recommendation": "actionable tip in Russian"
}
Metrics (6h):
- Avg Speed: ${avgSpeed} km/h
- Max Speed: ${maxSpeed} km/h
- Active time: ${activeHours} h
- Distance: ${totalDistKm} km
- Consistency (variance): ${speedVariance}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const resData = await response.json();
      const text = resData.candidates[0].content.parts[0].text;
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      setAnalysis(JSON.parse(jsonStr));
    } catch (e) {
      console.error(e);
      setAnalysis({
        status: 'warning',
        title: 'Ошибка анализа',
        analysis: 'Не удалось связаться с AI-ветеринаром.',
        recommendation: 'Проверьте соединение и попробуйте позже.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateVariance = (arr: number[]) => {
    const n = arr.length;
    const m = arr.reduce((a, b) => a + b) / n;
    return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / n;
  };

  const getStatusColor = (s: string) => {
    if (s === 'ok') return COLORS.green;
    if (s === 'warning') return COLORS.secondary;
    return COLORS.red;
  };

  const getStatusBg = (s: string) => {
    if (s === 'ok') return 'rgba(16, 185, 129, 0.05)';
    if (s === 'warning') return 'rgba(255, 189, 57, 0.05)';
    return 'rgba(255, 59, 48, 0.05)';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.primary} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Ветеринар</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color={COLORS.primary} />
             <Text style={styles.loadingText}>Анализируем поведение...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.animalCard}>
              <Text style={styles.analysisLabel}>Анализ • последние 6 часов</Text>
              <Text style={styles.animalInfo}>{animal.name} • {animal.type}</Text>
            </View>

            <View style={[styles.statusCard, { borderColor: getStatusColor(analysis.status) + '40', backgroundColor: getStatusBg(analysis.status) }]}>
              <View style={styles.statusBadge}>
                  {analysis.status === 'ok' ? <CheckCircle2 color={COLORS.green} size={20} /> : <ShieldAlert color={getStatusColor(analysis.status)} size={20} />}
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(analysis.status) }]}>{analysis.title}</Text>
              </View>
              <Text style={styles.analysisText}>{analysis.analysis}</Text>
            </View>

            <View style={styles.recommendCard}>
              <Text style={styles.recommendLabel}>РЕКОМЕНДАЦИЯ:</Text>
              <Text style={styles.recommendText}>{analysis.recommendation}</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
                <Text style={styles.btnText}>Вернуться</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: 15 },
  scrollContent: { padding: SPACING.lg },
  animalCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  analysisLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  animalInfo: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statusCard: { padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusBadgeText: { fontSize: 18, fontWeight: 'bold' },
  analysisText: { fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  recommendCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 24, marginBottom: 30, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  recommendLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  recommendText: { fontSize: 16, color: '#FFF', lineHeight: 24 },
  btn: { width: '100%', height: 60, borderRadius: 20, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default AIVetScreen;
