import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'MASUKKAN_SUPABASE_URL_ANDA';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'MASUKKAN_SUPABASE_ANON_KEY_ANDA';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export default function App() {
  const [siswa, setSiswa] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, siswa, prestasi
  const [modal, setModal] = useState(null); // 'add-siswa', 'edit-siswa', 'add-prestasi', 'edit-prestasi'
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchSiswa, setSearchSiswa] = useState("");
  const [searchPrestasi, setSearchPrestasi] = useState("");

  // Form Siswa
  const [formSiswa, setFormSiswa] = useState({
    nis: "",
    nama: "",
    jenis_kelamin: "",
    tanggal_lahir: "",
    alamat: "",
    kelas: "",
    jurusan: "",
    no_hp: "",
    email: "",
  });

  // Form Prestasi
  const [formPrestasi, setFormPrestasi] = useState({
    id_siswa: "",
    nama_prestasi: "",
    tingkat: "",
    tanggal: "",
    deskripsi: "",
  });

  // ==========================================
  // FETCH DATA DARI SUPABASE
  // ==========================================
  const fetchData = async () => {
    setError("");
    try {
      // 1. Ambil Siswa
      const resSiswa = await fetch(
        `${SUPABASE_URL}/rest/v1/siswa?select=*&order=id_siswa.asc`,
        { method: "GET", headers }
      );
      if (!resSiswa.ok) throw new Error("Gagal mengambil data siswa");
      const dataSiswa = await resSiswa.json();
      setSiswa(dataSiswa || []);

      // 2. Ambil Prestasi
      const resPrestasi = await fetch(
        `${SUPABASE_URL}/rest/v1/prestasi?select=*&order=id_prestasi.asc`,
        { method: "GET", headers }
      );
      if (resPrestasi.ok) {
        const dataPrestasi = await resPrestasi.json();
        setPrestasi(dataPrestasi || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // CRUD SISWA
  // ==========================================
  const resetSiswaForm = () => {
    setFormSiswa({
      nis: "", nama: "", jenis_kelamin: "", tanggal_lahir: "",
      alamat: "", kelas: "", jurusan: "", no_hp: "", email: ""
    });
  };

  const simpanSiswa = async () => {
    if (!formSiswa.nis || !formSiswa.nama || !formSiswa.kelas) {
      Alert.alert("Peringatan", "NIS, Nama, dan Kelas wajib diisi!");
      return;
    }

    setSaving(true);
    const payload = { ...formSiswa };
    if (!payload.tanggal_lahir) payload.tanggal_lahir = null;

    try {
      const isEdit = modal === "edit-siswa";
      const url = isEdit
        ? `${SUPABASE_URL}/rest/v1/siswa?id_siswa=eq.${formSiswa.id_siswa}`
        : `${SUPABASE_URL}/rest/v1/siswa`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data siswa");

      await fetchData();
      setModal(null);
      resetSiswaForm();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const hapusSiswa = (id) => {
    Alert.alert("Konfirmasi", "Yakin ingin menghapus siswa ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/siswa?id_siswa=eq.${id}`, {
              method: "DELETE",
              headers,
            });
            setSiswa(siswa.filter(s => s.id_siswa !== id));
          } catch (err) {
            Alert.alert("Error", "Gagal menghapus");
          } finally {
            setDeletingId(null);
          }
        }
      }
    ]);
  };

  // ==========================================
  // CRUD PRESTASI
  // ==========================================
  const resetPrestasiForm = () => {
    setFormPrestasi({ id_siswa: "", nama_prestasi: "", tingkat: "", tanggal: "", deskripsi: "" });
  };

  const simpanPrestasi = async () => {
    if (!formPrestasi.id_siswa || !formPrestasi.nama_prestasi) {
      Alert.alert("Peringatan", "Pilih siswa dan nama prestasi!");
      return;
    }

    setSaving(true);
    const payload = {
      ...formPrestasi,
      id_siswa: Number(formPrestasi.id_siswa),
      tanggal: formPrestasi.tanggal || null
    };

    try {
      const isEdit = modal === "edit-prestasi";
      const url = isEdit
        ? `${SUPABASE_URL}/rest/v1/prestasi?id_prestasi=eq.${formPrestasi.id_prestasi}`
        : `${SUPABASE_URL}/rest/v1/prestasi`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Gagal menyimpan prestasi");

      await fetchData();
      setModal(null);
      resetPrestasiForm();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const hapusPrestasi = (id) => {
    Alert.alert("Konfirmasi", "Yakin ingin menghapus prestasi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/prestasi?id_prestasi=eq.${id}`, {
              method: "DELETE",
              headers,
            });
            setPrestasi(prestasi.filter(p => p.id_prestasi !== id));
          } catch (err) {
            Alert.alert("Error", "Gagal menghapus");
          }
        }
      }
    ]);
  };

  // Filter Search
  const filteredSiswa = useMemo(() => {
    return siswa.filter(s => 
      s.nama?.toLowerCase().includes(searchSiswa.toLowerCase()) || 
      s.nis?.toLowerCase().includes(searchSiswa.toLowerCase())
    );
  }, [siswa, searchSiswa]);

  const filteredPrestasi = useMemo(() => {
    return prestasi.filter(p => {
      const namaSiswa = siswa.find(s => s.id_siswa === p.id_siswa)?.nama || "";
      return namaSiswa.toLowerCase().includes(searchPrestasi.toLowerCase()) ||
             p.nama_prestasi?.toLowerCase().includes(searchPrestasi.toLowerCase());
    });
  }, [prestasi, siswa, searchPrestasi]);

  const getNamaSiswa = (id) => siswa.find(s => s.id_siswa === id)?.nama || "Tidak diketahui";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* HEADER UTAMA */}
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>SISTEM AKADEMIK</Text>
        </View>
        <Text style={styles.headerTitle}>Katalog Prestasi Siswa</Text>
      </View>

      {/* KONTEN UTAMA BERDASARKAN TAB */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <>
            {/* 1. DASHBOARD */}
            {activeTab === "dashboard" && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                  <Text style={styles.heroTitle}>Selamat Datang!</Text>
                  <Text style={styles.heroDesc}>
                    Pantau dan kelola pencapaian portofolio siswa dengan mudah melalui aplikasi seluler.
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>{siswa.length}</Text>
                    <Text style={styles.statLabel}>Total Siswa</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.statValue, { color: '#d97706' }]}>{prestasi.length}</Text>
                    <Text style={styles.statLabel}>Total Prestasi</Text>
                  </View>
                </View>

                <Text style={styles.sectionHeading}>Aktivitas / Prestasi Terbaru</Text>
                {prestasi.slice(0, 5).map(p => (
                  <View key={p.id_prestasi} style={styles.recentItem}>
                    <View style={styles.recentDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentTitle}>{p.nama_prestasi}</Text>
                      <Text style={styles.recentSub}>{getNamaSiswa(p.id_siswa)} • Tingkat {p.tingkat}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* 2. DATA SISWA */}
            {activeTab === "siswa" && (
              <View style={{ flex: 1 }}>
                <View style={styles.toolbar}>
                  <TextInput
                    style={styles.searchBox}
                    placeholder="Cari nama atau NIS siswa..."
                    value={searchSiswa}
                    onChangeText={setSearchSiswa}
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => { resetSiswaForm(); setModal("add-siswa"); }}
                  >
                    <Text style={styles.addButtonText}>+ Siswa</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredSiswa.map(item => (
                    <View key={item.id_siswa} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{item.nama?.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.cardTitle}>{item.nama}</Text>
                          <Text style={styles.cardSub}>NIS: {item.nis} | Kelas: {item.kelas}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDetail}>Jurusan: {item.jurusan} ({item.jenis_kelamin})</Text>
                      
                      <View style={styles.cardActions}>
                        <TouchableOpacity 
                          style={styles.btnEdit} 
                          onPress={() => { setFormSiswa(item); setModal("edit-siswa"); }}
                        >
                          <Text style={styles.btnEditText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.btnDelete} 
                          onPress={() => hapusSiswa(item.id_siswa)}
                        >
                          <Text style={styles.btnDeleteText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. DATA PRESTASI */}
            {activeTab === "prestasi" && (
              <View style={{ flex: 1 }}>
                <View style={styles.toolbar}>
                  <TextInput
                    style={styles.searchBox}
                    placeholder="Cari prestasi / siswa..."
                    value={searchPrestasi}
                    onChangeText={setSearchPrestasi}
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => { resetPrestasiForm(); setModal("add-prestasi"); }}
                  >
                    <Text style={styles.addButtonText}>+ Prestasi</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredPrestasi.map(item => (
                    <View key={item.id_prestasi} style={styles.card}>
                      <Text style={styles.cardTitle}>{item.nama_prestasi}</Text>
                      <Text style={styles.cardSub}>Siswa: {getNamaSiswa(item.id_siswa)}</Text>
                      <Text style={styles.cardDetail}>Tingkat: {item.tingkat} • Tanggal: {item.tanggal || '-'}</Text>
                      {item.deskripsi ? <Text style={styles.cardDesc}>{item.deskripsi}</Text> : null}

                      <View style={styles.cardActions}>
                        <TouchableOpacity 
                          style={styles.btnEdit} 
                          onPress={() => { setFormPrestasi(item); setModal("edit-prestasi"); }}
                        >
                          <Text style={styles.btnEditText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.btnDelete} 
                          onPress={() => hapusPrestasi(item.id_prestasi)}
                        >
                          <Text style={styles.btnDeleteText}>Hapus</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

      {/* BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === "dashboard" && styles.navActive]} 
          onPress={() => setActiveTab("dashboard")}
        >
          <Text style={[styles.navText, activeTab === "dashboard" && styles.navTextActive]}>🏠 Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === "siswa" && styles.navActive]} 
          onPress={() => setActiveTab("siswa")}
        >
          <Text style={[styles.navText, activeTab === "siswa" && styles.navTextActive]}>🎓 Siswa</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === "prestasi" && styles.navActive]} 
          onPress={() => setActiveTab("prestasi")}
        >
          <Text style={[styles.navText, activeTab === "prestasi" && styles.navTextActive]}>🏆 Prestasi</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL FORM SISWA */}
      <Modal visible={modal === "add-siswa" || modal === "edit-siswa"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modal === "add-siswa" ? "Tambah Siswa" : "Edit Siswa"}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>NIS *</Text>
              <TextInput style={styles.input} value={formSiswa.nis} onChangeText={t => setFormSiswa({...formSiswa, nis: t})} />
              
              <Text style={styles.label}>Nama Lengkap *</Text>
              <TextInput style={styles.input} value={formSiswa.nama} onChangeText={t => setFormSiswa({...formSiswa, nama: t})} />
              
              <Text style={styles.label}>Jenis Kelamin (Laki-laki / Perempuan)</Text>
              <TextInput style={styles.input} value={formSiswa.jenis_kelamin} onChangeText={t => setFormSiswa({...formSiswa, jenis_kelamin: t})} />
              
              <Text style={styles.label}>Kelas *</Text>
              <TextInput style={styles.input} value={formSiswa.kelas} onChangeText={t => setFormSiswa({...formSiswa, kelas: t})} />
              
              <Text style={styles.label}>Jurusan *</Text>
              <TextInput style={styles.input} value={formSiswa.jurusan} onChangeText={t => setFormSiswa({...formSiswa, jurusan: t})} />

              <Text style={styles.label}>No HP</Text>
              <TextInput style={styles.input} value={formSiswa.no_hp} onChangeText={t => setFormSiswa({...formSiswa, no_hp: t})} />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={formSiswa.email} onChangeText={t => setFormSiswa({...formSiswa, email: t})} />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModal(null)}>
                <Text style={{color: '#64748b', fontWeight: 'bold'}}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={simpanSiswa} disabled={saving}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{saving ? "Menyimpan..." : "Simpan"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL FORM PRESTASI */}
      <Modal visible={modal === "add-prestasi" || modal === "edit-prestasi"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modal === "add-prestasi" ? "Tambah Prestasi" : "Edit Prestasi"}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>ID Siswa (Pilih ID dari daftar siswa) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(formPrestasi.id_siswa)} onChangeText={t => setFormPrestasi({...formPrestasi, id_siswa: t})} />
              
              <Text style={styles.label}>Nama Prestasi *</Text>
              <TextInput style={styles.input} value={formPrestasi.nama_prestasi} onChangeText={t => setFormPrestasi({...formPrestasi, nama_prestasi: t})} />
              
              <Text style={styles.label}>Tingkat (Sekolah / Kabupaten / Nasional, dll)</Text>
              <TextInput style={styles.input} value={formPrestasi.tingkat} onChangeText={t => setFormPrestasi({...formPrestasi, tingkat: t})} />
              
              <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={formPrestasi.tanggal} onChangeText={t => setFormPrestasi({...formPrestasi, tanggal: t})} />
              
              <Text style={styles.label}>Deskripsi</Text>
              <TextInput style={styles.input} value={formPrestasi.deskripsi} onChangeText={t => setFormPrestasi({...formPrestasi, deskripsi: t})} />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModal(null)}>
                <Text style={{color: '#64748b', fontWeight: 'bold'}}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={simpanPrestasi} disabled={saving}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{saving ? "Menyimpan..." : "Simpan"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// STYLES REACT NATIVE
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  badgeContainer: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  
  heroCard: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 20, marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  heroDesc: { fontSize: 13, color: '#e0e7ff', lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },

  sectionHeading: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  recentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5', marginRight: 12 },
  recentTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  recentSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  toolbar: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBox: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, height: 40, fontSize: 13 },
  addButton: { backgroundColor: '#4f46e5', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 8, height: 40 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: '#4f46e5', fontSize: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  cardSub: { fontSize: 12, color: '#64748b' },
  cardDetail: { fontSize: 12, color: '#334155', marginTop: 4 },
  cardDesc: { fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  btnEdit: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 6 },
  btnEditText: { color: '#4f46e5', fontSize: 12, fontWeight: 'bold' },
  btnDelete: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#fef2f2', borderRadius: 6 },
  btnDeleteText: { color: '#dc2626', fontSize: 12, fontWeight: 'bold' },

  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', height: 60 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navActive: { borderTopWidth: 2, borderTopColor: '#4f46e5' },
  navText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  navTextActive: { color: '#4f46e5' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#0f172a' },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13, backgroundColor: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  btnCancel: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#f1f5f9' },
  btnSave: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#4f46e5' },
});