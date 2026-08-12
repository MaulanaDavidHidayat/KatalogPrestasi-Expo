import React, { useState, useEffect, useMemo, useRef } from "react";
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
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Mengaktifkan LayoutAnimation untuk Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUPABASE_URL = "https://bhaftdneppxzxksavkbz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lMdTCY3dIgjarwsF31HY8Q_5V69CgP6";
const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

export default function App() {
  const { width } = useWindowDimensions();
  const TAB_WIDTH = width / 3;

  const [siswa, setSiswa] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchSiswa, setSearchSiswa] = useState("");
  const [searchPrestasi, setSearchPrestasi] = useState("");

  // State untuk mengontrol Dropdown Siswa di Form Prestasi
  const [showSiswaDropdown, setShowSiswaDropdown] = useState(false);

  // Animasi untuk Sliding Tab Bottom Nav
  const tabOffsetValue = useRef(new Animated.Value(0)).current;

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

  const [formPrestasi, setFormPrestasi] = useState({
    id_siswa: "",
    nama_prestasi: "",
    tingkat: "",
    tanggal: "",
    deskripsi: "",
  });

  const changeTab = (tab) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setActiveTab(tab);

    const index = tab === "dashboard" ? 0 : tab === "siswa" ? 1 : 2;
    Animated.spring(tabOffsetValue, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      bounciness: 14,
      speed: 12,
    }).start();
  };

  const fetchData = async () => {
    setError("");
    try {
      const resSiswa = await fetch(
        `${SUPABASE_URL}/rest/v1/siswa?select=*&order=id_siswa.asc`,
        { method: "GET", headers },
      );
      if (!resSiswa.ok) throw new Error("Gagal mengambil data siswa");
      const dataSiswa = await resSiswa.json();
      setSiswa(dataSiswa || []);

      const resPrestasi = await fetch(
        `${SUPABASE_URL}/rest/v1/prestasi?select=*&order=id_prestasi.asc`,
        { method: "GET", headers },
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

  const resetSiswaForm = () => {
    setFormSiswa({
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
            setSiswa(siswa.filter((s) => s.id_siswa !== id));
          } catch (err) {
            Alert.alert("Error", "Gagal menghapus");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const resetPrestasiForm = () => {
    setFormPrestasi({
      id_siswa: "",
      nama_prestasi: "",
      tingkat: "",
      tanggal: "",
      deskripsi: "",
    });
    setShowSiswaDropdown(false);
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
      tanggal: formPrestasi.tanggal || null,
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
            await fetch(
              `${SUPABASE_URL}/rest/v1/prestasi?id_prestasi=eq.${id}`,
              { method: "DELETE", headers },
            );
            setPrestasi(prestasi.filter((p) => p.id_prestasi !== id));
          } catch (err) {
            Alert.alert("Error", "Gagal menghapus");
          }
        },
      },
    ]);
  };

  const filteredSiswa = useMemo(() => {
    return siswa.filter(
      (s) =>
        s.nama?.toLowerCase().includes(searchSiswa.toLowerCase()) ||
        s.nis?.toLowerCase().includes(searchSiswa.toLowerCase()),
    );
  }, [siswa, searchSiswa]);

  const filteredPrestasi = useMemo(() => {
    return prestasi.filter((p) => {
      const namaSiswa =
        siswa.find((s) => s.id_siswa === p.id_siswa)?.nama || "";
      return (
        namaSiswa.toLowerCase().includes(searchPrestasi.toLowerCase()) ||
        p.nama_prestasi?.toLowerCase().includes(searchPrestasi.toLowerCase())
      );
    });
  }, [prestasi, siswa, searchPrestasi]);

  const getNamaSiswa = (id) =>
    siswa.find((s) => s.id_siswa === id)?.nama || "Tidak diketahui";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER UTAMA */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>SISTEM KATALOG PRESTASI</Text>
          </View>
          <Text style={styles.headerTitle}>Katalog Prestasi Siswa</Text>
        </View>
      </View>

      {/* KONTEN UTAMA */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4338ca" />
            <Text style={styles.loadingText}>Menyiapkan ruang kerja...</Text>
          </View>
        ) : (
          <>
            {/* 1. DASHBOARD */}
            {activeTab === "dashboard" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollPadding}
              >
                <View style={styles.heroCard}>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>Selamat Datang!</Text>
                    <Text style={styles.heroDesc}>
                      Pantau dan kelola pencapaian portofolio siswa SMKN 1
                      Kraksaan dengan aplikasi Katalog Prestasi Siswa untuk 
                      melihat data siswa dan prestasi mereka secara mudah.
                    </Text>
                  </View>
                  <Ionicons
                    name="trophy"
                    size={85}
                    color="rgba(255,255,255,0.12)"
                    style={styles.heroIcon}
                  />
                </View>

                {/* SHORTCUT MENU */}
                <View style={styles.statsRow}>
                  <TouchableOpacity
                    style={styles.statBox}
                    activeOpacity={0.7}
                    onPress={() => changeTab("siswa")}
                  >
                    <View
                      style={[
                        styles.statIconWrap,
                        { backgroundColor: "#EEF2FF" },
                      ]}
                    >
                      <Ionicons name="people" size={26} color="#4F46E5" />
                    </View>
                    <Text style={styles.statValue}>{siswa.length}</Text>
                    <Text style={styles.statLabel}>Data Siswa</Text>
                    <View style={styles.shortcutArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#94a3b8"
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statBox}
                    activeOpacity={0.7}
                    onPress={() => changeTab("prestasi")}
                  >
                    <View
                      style={[
                        styles.statIconWrap,
                        { backgroundColor: "#FFFBEB" },
                      ]}
                    >
                      <Ionicons name="star" size={26} color="#D97706" />
                    </View>
                    <Text style={styles.statValue}>{prestasi.length}</Text>
                    <Text style={styles.statLabel}>Total Prestasi</Text>
                    <View style={styles.shortcutArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#94a3b8"
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionHeading}>Aktivitas Terbaru</Text>
                  <Ionicons name="pulse" size={20} color="#D97706" />
                </View>

                {prestasi.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="leaf-outline" size={50} color="#cbd5e1" />
                    <Text style={styles.emptyStateText}>
                      Belum ada prestasi yang tercatat.
                    </Text>
                  </View>
                ) : (
                  prestasi.slice(0, 5).map((p) => (
                    <View key={p.id_prestasi} style={styles.recentItem}>
                      <View style={styles.recentIconBox}>
                        <Ionicons name="medal" size={22} color="#4338ca" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentTitle}>
                          {p.nama_prestasi}
                        </Text>
                        <Text style={styles.recentSub}>
                          {getNamaSiswa(p.id_siswa)} • {p.tingkat}
                        </Text>
                      </View>
                      <View style={styles.recentActionIndicator}>
                        <Text style={styles.recentActionText}>Baru</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {/* 2. DATA SISWA */}
            {activeTab === "siswa" && (
              <View style={{ flex: 1 }}>
                <View style={styles.toolbar}>
                  <View style={styles.searchContainer}>
                    <Ionicons
                      name="search"
                      size={20}
                      color="#94a3b8"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchBox}
                      placeholder="Cari nama atau NIS siswa SMKN 1 Kraksaan..."
                      placeholderTextColor="#94a3b8"
                      value={searchSiswa}
                      onChangeText={setSearchSiswa}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      resetSiswaForm();
                      setModal("add-siswa");
                    }}
                  >
                    <Ionicons name="add" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollPadding}
                >
                  {filteredSiswa.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="folder-open-outline"
                        size={56}
                        color="#cbd5e1"
                      />
                      <Text style={styles.emptyStateText}>
                        Data siswa tidak ditemukan.
                      </Text>
                    </View>
                  ) : (
                    filteredSiswa.map((item) => (
                      <View key={item.id_siswa} style={styles.card}>
                        <View style={styles.cardHeader}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {item.nama?.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.cardTitle}>{item.nama}</Text>
                            <View style={styles.badgeOutline}>
                              <Text style={styles.badgeOutlineText}>
                                NIS: {item.nis}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.cardInfoRow}>
                          <Ionicons name="school" size={16} color="#64748b" />
                          <Text style={styles.cardDetail}>
                            Kelas {item.kelas} • {item.jurusan}
                          </Text>
                        </View>

                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.btnActionList}
                            onPress={() => {
                              setFormSiswa(item);
                              setModal("edit-siswa");
                            }}
                          >
                            <Ionicons name="create" size={18} color="#4338ca" />
                            <Text style={styles.btnEditText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnActionList}
                            onPress={() => hapusSiswa(item.id_siswa)}
                          >
                            <Ionicons name="trash" size={18} color="#ef4444" />
                            <Text style={styles.btnDeleteText}>Hapus</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* 3. DATA PRESTASI */}
            {activeTab === "prestasi" && (
              <View style={{ flex: 1 }}>
                <View style={styles.toolbar}>
                  <View style={styles.searchContainer}>
                    <Ionicons
                      name="search"
                      size={20}
                      color="#94a3b8"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchBox}
                      placeholder="Cari prestasi / siswa..."
                      placeholderTextColor="#94a3b8"
                      value={searchPrestasi}
                      onChangeText={setSearchPrestasi}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      resetPrestasiForm();
                      setModal("add-prestasi");
                    }}
                  >
                    <Ionicons name="add" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollPadding}
                >
                  {filteredPrestasi.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="folder-open-outline"
                        size={56}
                        color="#cbd5e1"
                      />
                      <Text style={styles.emptyStateText}>
                        Data prestasi tidak ditemukan.
                      </Text>
                    </View>
                  ) : (
                    filteredPrestasi.map((item) => (
                      <View key={item.id_prestasi} style={styles.card}>
                        <View style={styles.prestasiHeader}>
                          <View style={styles.prestasiIcon}>
                            <Ionicons name="ribbon" size={30} color="#d97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>
                              {item.nama_prestasi}
                            </Text>
                            <Text style={styles.cardSubPrimary}>
                              {getNamaSiswa(item.id_siswa)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.prestasiDetailBox}>
                          <View style={styles.prestasiDetailRow}>
                            <Ionicons name="layers" size={16} color="#64748b" />
                            <Text style={styles.cardDetail}>
                              Tingkat {item.tingkat}
                            </Text>
                          </View>
                          <View style={styles.prestasiDetailRow}>
                            <Ionicons
                              name="calendar"
                              size={16}
                              color="#64748b"
                            />
                            <Text style={styles.cardDetail}>
                              {item.tanggal || "Tidak ada tanggal"}
                            </Text>
                          </View>
                        </View>

                        {item.deskripsi ? (
                          <Text style={styles.cardDesc}>
                            "{item.deskripsi}"
                          </Text>
                        ) : null}

                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.btnActionList}
                            onPress={() => {
                              setFormPrestasi(item);
                              setModal("edit-prestasi");
                            }}
                          >
                            <Ionicons name="create" size={18} color="#4338ca" />
                            <Text style={styles.btnEditText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnActionList}
                            onPress={() => hapusPrestasi(item.id_prestasi)}
                          >
                            <Ionicons name="trash" size={18} color="#ef4444" />
                            <Text style={styles.btnDeleteText}>Hapus</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>

      {/* BOTTOM NAVIGATION BAR DENGAN ANIMASI HOVER SLIDING */}
      <View style={styles.bottomNavContainer}>
        {/* Indikator Hover yang Meluncur (Sliding Pill) */}
        <Animated.View
          style={[
            styles.slidingPillContainer,
            { transform: [{ translateX: tabOffsetValue }], width: TAB_WIDTH },
          ]}
        >
          <View style={styles.slidingPill} />
        </Animated.View>

        {/* Tombol Tab Navigasi */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => changeTab("dashboard")}
        >
          <Ionicons
            name={activeTab === "dashboard" ? "grid" : "grid-outline"}
            size={24}
            color={activeTab === "dashboard" ? "#4338ca" : "#64748b"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "dashboard" && styles.navTextActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => changeTab("siswa")}
        >
          <Ionicons
            name={activeTab === "siswa" ? "people" : "people-outline"}
            size={26}
            color={activeTab === "siswa" ? "#4338ca" : "#64748b"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "siswa" && styles.navTextActive,
            ]}
          >
            Siswa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => changeTab("prestasi")}
        >
          <Ionicons
            name={activeTab === "prestasi" ? "trophy" : "trophy-outline"}
            size={26}
            color={activeTab === "prestasi" ? "#4338ca" : "#64748b"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "prestasi" && styles.navTextActive,
            ]}
          >
            Prestasi
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL FORM SISWA */}
      <Modal
        visible={modal === "add-siswa" || modal === "edit-siswa"}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modal === "add-siswa"
                  ? "Tambah Data Siswa"
                  : "Edit Data Siswa"}
              </Text>
              <TouchableOpacity
                onPress={() => setModal(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NIS *</Text>
                <TextInput
                  style={styles.input}
                  value={formSiswa.nis}
                  onChangeText={(t) => setFormSiswa({ ...formSiswa, nis: t })}
                  placeholder="Contoh: 123456"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Lengkap *</Text>
                <TextInput
                  style={styles.input}
                  value={formSiswa.nama}
                  onChangeText={(t) => setFormSiswa({ ...formSiswa, nama: t })}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Kelas *</Text>
                  <TextInput
                    style={styles.input}
                    value={formSiswa.kelas}
                    onChangeText={(t) =>
                      setFormSiswa({ ...formSiswa, kelas: t })
                    }
                    placeholder="X/XI/XII"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Jurusan *</Text>
                  <TextInput
                    style={styles.input}
                    value={formSiswa.jurusan}
                    onChangeText={(t) =>
                      setFormSiswa({ ...formSiswa, jurusan: t })
                    }
                    placeholder="IPA/IPS/RPL"
                    placeholderTextColor="#cbd5e1"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jenis Kelamin</Text>
                <TextInput
                  style={styles.input}
                  value={formSiswa.jenis_kelamin}
                  onChangeText={(t) =>
                    setFormSiswa({ ...formSiswa, jenis_kelamin: t })
                  }
                  placeholder="Laki-laki / Perempuan"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>No HP</Text>
                <TextInput
                  style={styles.input}
                  value={formSiswa.no_hp}
                  keyboardType="phone-pad"
                  onChangeText={(t) => setFormSiswa({ ...formSiswa, no_hp: t })}
                  placeholder="08xxxxxxxxxx"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formSiswa.email}
                  keyboardType="email-address"
                  onChangeText={(t) => setFormSiswa({ ...formSiswa, email: t })}
                  placeholder="email@contoh.com"
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.btnSaveForm}
              onPress={simpanSiswa}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveFormText}>Simpan Data</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL FORM PRESTASI DENGAN CUSTOM SELECT SISWA */}
      <Modal
        visible={modal === "add-prestasi" || modal === "edit-prestasi"}
        animationType="slide"
        transparent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modal === "add-prestasi"
                  ? "Catat Prestasi Baru"
                  : "Edit Data Prestasi"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModal(null);
                  setShowSiswaDropdown(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {/* === DROPDOWN PILIH SISWA CUSTOM === */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Siswa *</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
                  activeOpacity={0.7}
                  onPress={() => setShowSiswaDropdown(!showSiswaDropdown)}
                >
                  <Text
                    style={
                      formPrestasi.id_siswa
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {formPrestasi.id_siswa
                      ? getNamaSiswa(formPrestasi.id_siswa)
                      : "Pilih siswa dari daftar..."}
                  </Text>
                  <Ionicons
                    name={showSiswaDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {showSiswaDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={{ maxHeight: 180 }}
                    >
                      {siswa.length === 0 ? (
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { padding: 16, color: "#94a3b8" },
                          ]}
                        >
                          Belum ada data siswa.
                        </Text>
                      ) : (
                        siswa.map((s) => (
                          <TouchableOpacity
                            key={s.id_siswa}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setFormPrestasi({
                                ...formPrestasi,
                                id_siswa: s.id_siswa,
                              });
                              setShowSiswaDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>
                              {s.nama}
                            </Text>
                            <Text style={styles.dropdownItemSubText}>
                              NIS: {s.nis} • Kelas {s.kelas}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Prestasi *</Text>
                <TextInput
                  style={styles.input}
                  value={formPrestasi.nama_prestasi}
                  onChangeText={(t) =>
                    setFormPrestasi({ ...formPrestasi, nama_prestasi: t })
                  }
                  placeholder="Contoh: Juara 1 Lomba Koding"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tingkat</Text>
                <TextInput
                  style={styles.input}
                  value={formPrestasi.tingkat}
                  onChangeText={(t) =>
                    setFormPrestasi({ ...formPrestasi, tingkat: t })
                  }
                  placeholder="Kabupaten / Provinsi / Nasional"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal</Text>
                <TextInput
                  style={styles.input}
                  value={formPrestasi.tanggal}
                  onChangeText={(t) =>
                    setFormPrestasi({ ...formPrestasi, tanggal: t })
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#cbd5e1"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Deskripsi Singkat</Text>
                <TextInput
                  style={[
                    styles.input,
                    { height: 100, textAlignVertical: "top", paddingTop: 16 },
                  ]}
                  multiline
                  value={formPrestasi.deskripsi}
                  onChangeText={(t) =>
                    setFormPrestasi({ ...formPrestasi, deskripsi: t })
                  }
                  placeholder="Jelaskan detail prestasi..."
                  placeholderTextColor="#cbd5e1"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.btnSaveForm}
              onPress={simpanPrestasi}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnSaveFormText}>Simpan Prestasi</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ==========================================
// STYLES REACT NATIVE PREMIUM UI
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  header: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  badgeContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4338ca",
    letterSpacing: 1.2,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#0f172a" },

  content: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 14,
    color: "#64748b",
    fontWeight: "600",
    fontSize: 16,
  },

  scrollPadding: { paddingBottom: 110, paddingTop: 16 }, // Padding agar data tidak tertutup Bottom Nav

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 14,
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "600",
  },

  // DASHBOARD
  heroCard: {
    backgroundColor: "#4338ca",
    borderRadius: 24,
    padding: 26,
    marginBottom: 20,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
  },
  heroTextContainer: { flex: 1, zIndex: 2 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroDesc: {
    fontSize: 14,
    color: "#e0e7ff",
    lineHeight: 22,
    fontWeight: "500",
  },
  heroIcon: {
    position: "absolute",
    right: -15,
    bottom: -20,
    zIndex: 1,
    transform: [{ rotate: "-15deg" }],
  },

  statsRow: { flexDirection: "row", gap: 16, marginBottom: 26 },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  statIconWrap: { padding: 12, borderRadius: 14, marginBottom: 16 },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
  },
  shortcutArrow: {
    position: "absolute",
    right: 16,
    top: 20,
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 20,
  },

  sectionHeaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionHeading: { fontSize: 18, fontWeight: "900", color: "#0f172a" },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  recentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  recentSub: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  recentActionIndicator: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recentActionText: { fontSize: 10, fontWeight: "bold", color: "#d97706" },

  // TOOLBAR (SEARCH & ADD)
  toolbar: { flexDirection: "row", gap: 14, marginBottom: 4, marginTop: 4 },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 18,
    height: 58,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIcon: { marginRight: 12 },
  searchBox: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    height: "100%",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#4338ca",
    justifyContent: "center",
    alignItems: "center",
    width: 58,
    height: 58,
    borderRadius: 18,
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },

  // CARDS (SISWA & PRESTASI)
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontWeight: "900", color: "#4338ca", fontSize: 24 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
  },
  badgeOutline: {
    alignSelf: "flex-start",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  badgeOutlineText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
  },
  cardDetail: { fontSize: 14, color: "#475569", fontWeight: "700" },

  prestasiHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 16,
  },
  prestasiIcon: { padding: 14, backgroundColor: "#FFFBEB", borderRadius: 18 },
  cardSubPrimary: {
    fontSize: 15,
    color: "#4338ca",
    fontWeight: "800",
    marginTop: 4,
  },
  prestasiDetailBox: { flexDirection: "row", gap: 16, marginBottom: 14 },
  prestasiDetailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDesc: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 6,
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
    lineHeight: 22,
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 18,
  },
  btnActionList: { flexDirection: "row", alignItems: "center", gap: 6 },
  btnEditText: { color: "#4338ca", fontSize: 14, fontWeight: "800" },
  btnDeleteText: { color: "#ef4444", fontSize: 14, fontWeight: "800" },

  // BOTTOM NAVIGATION BAR (DENGAN ANIMASI)
  bottomNavContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    height: Platform.OS === "ios" ? 90 : 75,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  slidingPillContainer: {
    position: "absolute",
    top: 0,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  slidingPill: {
    width: 65,
    height: 50,
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  navText: { fontSize: 11, color: "#94a3b8", fontWeight: "800", marginTop: 4 },
  navTextActive: { color: "#4338ca" },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#0f172a" },
  closeBtn: { backgroundColor: "#f1f5f9", padding: 8, borderRadius: 20 },
  modalScroll: { marginBottom: 26 },

  inputGroup: { marginBottom: 20 },
  rowInputs: { flexDirection: "row", justifyContent: "space-between" },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },

  // Custom Dropdown Styles
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60,
  },
  dropdownText: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  dropdownList: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "700",
  },
  dropdownItemSubText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },

  btnSaveForm: {
    backgroundColor: "#4338ca",
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4338ca",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: Platform.OS === "ios" ? 24 : 0,
  },
  btnSaveFormText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
