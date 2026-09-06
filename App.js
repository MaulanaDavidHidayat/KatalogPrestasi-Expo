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
  Animated,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://bhaftdneppxzxksavkbz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lMdTCY3dIgjarwsF31HY8Q_5V69CgP6";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// ==========================================
// APP
// ==========================================

export default function App() {
  const { width } = useWindowDimensions();
  const TAB_WIDTH = width / 4;

  // DATA
  const [siswa, setSiswa] = useState([]);
  const [prestasi, setPrestasi] = useState([]);

  // LOADING
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // NAVIGATION
  const [activeTab, setActiveTab] = useState("dashboard");

  // MODAL
  const [modal, setModal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailType, setDetailType] = useState(null);

  // DETAIL ANGGOTA KELOMPOK
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);

  // FORM
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // SEARCH
  const [searchSiswa, setSearchSiswa] = useState("");
  const [searchPrestasi, setSearchPrestasi] = useState("");

  // DROPDOWN STATES
  const [showSiswaDropdown, setShowSiswaDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showTingkatDropdown, setShowTingkatDropdown] = useState(false);

  // CUSTOM CALENDAR STATE
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState(null); // 'siswa' atau 'prestasi'
  const [currentDateObj, setCurrentDateObj] = useState(new Date());

  // ANIMATION BOTTOM NAV
  const tabOffsetValue = useRef(new Animated.Value(0)).current;

  // ==========================================
  // DATA ANGGOTA KELOMPOK
  // ==========================================
  const developerList = [
    {
      id: 1,
      nama: "Maulana David Hidayat",
      kelas: "XII PPLG 1",
      foto: require("./assets/1.jpg"),
    },
    {
      id: 2,
      nama: "Moh. Rizal Anwar",
      kelas: "XII PPLG 1",
      foto: require("./assets/2.jpg"),
    },
  ];

  const genderOptions = ["Laki-laki", "Perempuan"];
  const tingkatOptions = [
    "Sekolah",
    "Kecamatan",
    "Kabupaten",
    "Provinsi",
    "Nasional",
    "Internasional",
  ];

  // ==========================================
  // FORM SISWA
  // ==========================================

  const [formSiswa, setFormSiswa] = useState({
    id_siswa: "",
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

  // ==========================================
  // FORM PRESTASI
  // ==========================================

  const [formPrestasi, setFormPrestasi] = useState({
    id_prestasi: "",
    id_siswa: "",
    nama_prestasi: "",
    tingkat: "",
    tanggal: "",
    deskripsi: "",
  });

  // ==========================================
  // GANTI TAB
  // ==========================================

  const changeTab = (tab) => {
    setActiveTab(tab);

    const index =
      tab === "dashboard"
        ? 0
        : tab === "siswa"
          ? 1
          : tab === "prestasi"
            ? 2
            : 3;

    Animated.spring(tabOffsetValue, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      bounciness: 14,
      speed: 12,
    }).start();
  };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = async () => {
    setError("");

    try {
      const resSiswa = await fetch(
        `${SUPABASE_URL}/rest/v1/siswa?select=*&order=id_siswa.asc`,
        {
          method: "GET",
          headers,
        },
      );

      if (!resSiswa.ok) {
        throw new Error("Gagal mengambil data siswa");
      }

      const dataSiswa = await resSiswa.json();
      setSiswa(dataSiswa || []);

      const resPrestasi = await fetch(
        `${SUPABASE_URL}/rest/v1/prestasi?select=*&order=id_prestasi.asc`,
        {
          method: "GET",
          headers,
        },
      );

      if (!resPrestasi.ok) {
        throw new Error("Gagal mengambil data prestasi");
      }

      const dataPrestasi = await resPrestasi.json();
      setPrestasi(dataPrestasi || []);
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
  // RESET FORM SISWA
  // ==========================================

  const resetSiswaForm = () => {
    setFormSiswa({
      id_siswa: "",
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
    setShowGenderDropdown(false);
  };

  // ==========================================
  // RESET FORM PRESTASI
  // ==========================================

  const resetPrestasiForm = () => {
    setFormPrestasi({
      id_prestasi: "",
      id_siswa: "",
      nama_prestasi: "",
      tingkat: "",
      tanggal: "",
      deskripsi: "",
    });

    setShowSiswaDropdown(false);
    setShowTingkatDropdown(false);
  };

  // ==========================================
  // SIMPAN SISWA
  // ==========================================

  const simpanSiswa = async () => {
    if (!formSiswa.nis || !formSiswa.nama || !formSiswa.kelas) {
      Alert.alert("Peringatan", "NIS, Nama, dan Kelas wajib diisi!");
      return;
    }

    setSaving(true);

    const payload = {
      nis: formSiswa.nis,
      nama: formSiswa.nama,
      jenis_kelamin: formSiswa.jenis_kelamin,
      tanggal_lahir: formSiswa.tanggal_lahir || null,
      alamat: formSiswa.alamat,
      kelas: formSiswa.kelas,
      jurusan: formSiswa.jurusan,
      no_hp: formSiswa.no_hp,
      email: formSiswa.email,
    };

    try {
      const isEdit = modal === "edit-siswa";

      const url = isEdit
        ? `${SUPABASE_URL}/rest/v1/siswa?id_siswa=eq.${formSiswa.id_siswa}`
        : `${SUPABASE_URL}/rest/v1/siswa`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan data siswa");
      }

      await fetchData();

      setModal(null);
      resetSiswaForm();

      Alert.alert(
        "Berhasil",
        isEdit
          ? "Data siswa berhasil diperbarui."
          : "Data siswa berhasil ditambahkan.",
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HAPUS SISWA
  // ==========================================

  const hapusSiswa = (id) => {
    Alert.alert("Konfirmasi", "Yakin ingin menghapus siswa ini?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);

          try {
            const response = await fetch(
              `${SUPABASE_URL}/rest/v1/siswa?id_siswa=eq.${id}`,
              {
                method: "DELETE",
                headers,
              },
            );

            if (!response.ok) {
              throw new Error("Gagal menghapus siswa");
            }

            setSiswa(siswa.filter((s) => s.id_siswa !== id));

            Alert.alert("Berhasil", "Data siswa berhasil dihapus.");
          } catch (err) {
            Alert.alert("Error", err.message);
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  // ==========================================
  // SIMPAN PRESTASI
  // ==========================================

  const simpanPrestasi = async () => {
    if (!formPrestasi.id_siswa || !formPrestasi.nama_prestasi) {
      Alert.alert("Peringatan", "Pilih siswa dan nama prestasi!");
      return;
    }

    setSaving(true);

    const payload = {
      id_siswa: Number(formPrestasi.id_siswa),
      nama_prestasi: formPrestasi.nama_prestasi,
      tingkat: formPrestasi.tingkat,
      tanggal: formPrestasi.tanggal || null,
      deskripsi: formPrestasi.deskripsi,
    };

    try {
      const isEdit = modal === "edit-prestasi";

      const url = isEdit
        ? `${SUPABASE_URL}/rest/v1/prestasi?id_prestasi=eq.${formPrestasi.id_prestasi}`
        : `${SUPABASE_URL}/rest/v1/prestasi`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan prestasi");
      }

      await fetchData();

      setModal(null);
      resetPrestasiForm();

      Alert.alert(
        "Berhasil",
        isEdit
          ? "Prestasi berhasil diperbarui."
          : "Prestasi berhasil ditambahkan.",
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HAPUS PRESTASI
  // ==========================================

  const hapusPrestasi = (id) => {
    Alert.alert("Konfirmasi", "Yakin ingin menghapus prestasi ini?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(
              `${SUPABASE_URL}/rest/v1/prestasi?id_prestasi=eq.${id}`,
              {
                method: "DELETE",
                headers,
              },
            );

            if (!response.ok) {
              throw new Error("Gagal menghapus prestasi");
            }

            setPrestasi(prestasi.filter((p) => p.id_prestasi !== id));

            Alert.alert("Berhasil", "Data prestasi berhasil dihapus.");
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  // ==========================================
  // FILTER SISWA & PRESTASI
  // ==========================================

  const filteredSiswa = useMemo(() => {
    return siswa.filter((s) => {
      const search = searchSiswa.toLowerCase();
      return (
        s.nama?.toLowerCase().includes(search) ||
        String(s.nis).toLowerCase().includes(search)
      );
    });
  }, [siswa, searchSiswa]);

  const filteredPrestasi = useMemo(() => {
    return prestasi.filter((p) => {
      const namaSiswa =
        siswa.find((s) => s.id_siswa === p.id_siswa)?.nama || "";
      const search = searchPrestasi.toLowerCase();
      return (
        namaSiswa.toLowerCase().includes(search) ||
        p.nama_prestasi?.toLowerCase().includes(search)
      );
    });
  }, [prestasi, siswa, searchPrestasi]);

  const getNamaSiswa = (id) => {
    return siswa.find((s) => s.id_siswa === id)?.nama || "Tidak diketahui";
  };

  const bukaDetailSiswa = (item) => {
    setDetailData(item);
    setDetailType("siswa");
    setModal("detail");
  };

  const bukaDetailPrestasi = (item) => {
    setDetailData(item);
    setDetailType("prestasi");
    setModal("detail");
  };

  const tutupDetail = () => {
    setModal(null);
    setDetailData(null);
    setDetailType(null);
  };

  const getJumlahPrestasi = (idSiswa) => {
    return prestasi.filter((p) => p.id_siswa === idSiswa).length;
  };

  // ==========================================
  // KALENDER GENERATOR LOGIC
  // ==========================================
  const handleOpenCalendar = (target) => {
    setCalendarTarget(target);
    setCurrentDateObj(new Date());
    setShowCalendar(true);
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDateObj);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDateObj(newDate);
  };

  const selectDate = (year, month, day) => {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const formatted = `${year}-${mStr}-${dStr}`;

    if (calendarTarget === "siswa") {
      setFormSiswa({ ...formSiswa, tanggal_lahir: formatted });
    } else if (calendarTarget === "prestasi") {
      setFormPrestasi({ ...formPrestasi, tanggal: formatted });
    }
    setShowCalendar(false);
  };

  const clearDate = () => {
    if (calendarTarget === "siswa") {
      setFormSiswa({ ...formSiswa, tanggal_lahir: "" });
    } else if (calendarTarget === "prestasi") {
      setFormPrestasi({ ...formPrestasi, tanggal: "" });
    }
    setShowCalendar(false);
  };

  const selectToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    selectDate(year, month, day);
  };

  // Render Days Matrix for Calendar
  const renderCalendarDays = () => {
    const year = currentDateObj.getFullYear();
    const month = currentDateObj.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Hari dari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      days.push(
        <View key={`prev-${d}`} style={styles.calDayBoxDisabled}>
          <Text style={styles.calDayTextDisabled}>{d}</Text>
        </View>,
      );
    }

    // Hari dari bulan aktif
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const currentFormatted = `${year}-${mStr}-${dStr}`;

      const activeVal =
        calendarTarget === "siswa"
          ? formSiswa.tanggal_lahir
          : formPrestasi.tanggal;
      const isSelected = activeVal === currentFormatted;

      days.push(
        <TouchableOpacity
          key={`curr-${d}`}
          style={[styles.calDayBox, isSelected && styles.calDayBoxSelected]}
          onPress={() => selectDate(year, month, d)}
        >
          <Text
            style={[styles.calDayText, isSelected && styles.calDayTextSelected]}
          >
            {d}
          </Text>
        </TouchableOpacity>,
      );
    }

    return days;
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>SISTEM KATALOG PRESTASI</Text>
          </View>
          <Text style={styles.headerTitle}>Katalog Prestasi Siswa</Text>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4338ca" />
            <Text style={styles.loadingText}>Menyiapkan ruang kerja...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={60} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollPadding}
              >
                <View style={styles.heroCard}>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>Selamat Datang!</Text>
                    <Text style={styles.heroDesc}>
                      Pantau dan kelola pencapaian siswa SMKN 1
                      Kraksaan dengan aplikasi Katalog Prestasi Siswa.
                    </Text>
                  </View>
                  <Ionicons
                    name="trophy"
                    size={85}
                    color="rgba(255,255,255,0.12)"
                    style={styles.heroIcon}
                  />
                </View>

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
                      <Ionicons name="ribbon" size={26} color="#D97706" />
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
                    <TouchableOpacity
                      key={p.id_prestasi}
                      style={styles.recentItem}
                      activeOpacity={0.8}
                      onPress={() => bukaDetailPrestasi(p)}
                    >
                      <View style={styles.recentIconBox}>
                        <Ionicons name="ribbon" size={22} color="#D97706" />
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
                        <Text style={styles.recentActionText}>Detail</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            {/* DATA SISWA */}
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
                      placeholder="Cari nama atau NIS..."
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
                            style={styles.detailButton}
                            onPress={() => bukaDetailSiswa(item)}
                          >
                            <Ionicons name="eye" size={18} color="#0f766e" />
                            <Text style={styles.btnDetailText}>Detail</Text>
                          </TouchableOpacity>
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

            {/* DATA PRESTASI */}
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
                              Tingkat {item.tingkat || "-"}
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
                            style={styles.detailButton}
                            onPress={() => bukaDetailPrestasi(item)}
                          >
                            <Ionicons name="eye" size={18} color="#0f766e" />
                            <Text style={styles.btnDetailText}>Detail</Text>
                          </TouchableOpacity>
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

            {/* TENTANG */}
            {activeTab === "Tentang" && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollPadding}
              >
                <View style={styles.heroCard}>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>Tentang</Text>
                    <Text style={styles.heroDesc}>
                      Aplikasi Katalog Prestasi Siswa ini dikembangkan untuk
                      mencatat siswa yang berprestasi.
                    </Text>
                  </View>
                  <Ionicons
                    name="people-circle"
                    size={85}
                    color="rgba(255,255,255,0.12)"
                    style={styles.heroIcon}
                  />
                </View>

                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionHeading}>Daftar Anggota</Text>
                  <Ionicons name="id-card-outline" size={20} color="#4338ca" />
                </View>

                {developerList.map((dev) => (
                  <View key={dev.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.developerImageWrap}>
                        <Image
                          source={dev.foto}
                          style={styles.developerImage}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.cardTitle}>{dev.nama}</Text>
                        <View style={styles.badgeOutline}>
                          <Text style={styles.badgeOutlineText}>
                            {dev.kelas}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => {
                          setSelectedDeveloper(dev);
                          setModal("detail-dev");
                        }}
                      >
                        <Ionicons name="eye" size={18} color="#0f766e" />
                        <Text style={styles.btnDetailText}>
                          Lihat Detail Profil
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNavContainer}>
        <Animated.View
          style={[
            styles.slidingPillContainer,
            { transform: [{ translateX: tabOffsetValue }], width: TAB_WIDTH },
          ]}
        >
          <View style={styles.slidingPill} />
        </Animated.View>

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => changeTab("dashboard")}
        >
          <Ionicons
            name={activeTab === "dashboard" ? "grid" : "grid-outline"}
            size={22}
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
            size={24}
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
            name={activeTab === "prestasi" ? "ribbon" : "ribbon-outline"}
            size={24}
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

        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => changeTab("Tentang")}
        >
          <Ionicons
            name={
              activeTab === "Tentang" ? "person-circle" : "person-circle-outline"
            }
            size={24}
            color={activeTab === "Tentang" ? "#4338ca" : "#64748b"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "Tentang" && styles.navTextActive,
            ]}
          >
            Tentang
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==========================================
          CUSTOM CALENDAR MODAL
      ========================================== */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            {/* Calendar Header */}
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.calendarMonthText}>
                {monthNames[currentDateObj.getMonth()]}{" "}
                {currentDateObj.getFullYear()}
              </Text>
              <View style={styles.calendarNavBtns}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => changeMonth(-1)}
                >
                  <Ionicons name="chevron-up" size={18} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.calNavBtn, { marginLeft: 8 }]}
                  onPress={() => changeMonth(1)}
                >
                  <Ionicons name="chevron-down" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days Header (Su Mo Tu We Th Fr Sa) */}
            <View style={styles.calendarDaysHeader}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, idx) => (
                <Text key={idx} style={styles.calendarDayLabel}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Matrix Days */}
            <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

            {/* Footer Action (Clear & Today) */}
            <View style={styles.calendarFooter}>
              <TouchableOpacity onPress={clearDate}>
                <Text style={styles.calendarFooterBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectToday}>
                <Text
                  style={[styles.calendarFooterBtnText, { color: "#38bdf8" }]}
                >
                  Today
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          MODAL DETAIL PENGEMBANG
      ========================================== */}
      <Modal
        visible={modal === "detail-dev" && selectedDeveloper !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModal(null);
          setSelectedDeveloper(null);
        }}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>Profil Pengembang</Text>
                <Text style={styles.detailModalSubtitle}>
                  Detail perkenalan diri anggota
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModal(null);
                  setSelectedDeveloper(null);
                }}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedDeveloper && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScroll}
              >
                <View style={styles.detailProfile}>
                  <View style={styles.modalDeveloperImageWrap}>
                    <Image
                      source={selectedDeveloper.foto}
                      style={styles.developerImage}
                    />
                  </View>
                  <Text style={styles.detailName}>
                    {selectedDeveloper.nama}
                  </Text>
                  <View style={styles.detailNisBadge}>
                    <Text style={styles.detailNisText}>
                      {selectedDeveloper.kelas}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>
                  Informasi Personal
                </Text>
                <View style={styles.detailInfoCard}>
                  <DetailRow
                    icon="person-outline"
                    label="Nama Lengkap"
                    value={selectedDeveloper.nama}
                  />
                  <DetailRow
                    icon="school-outline"
                    label="Kelas"
                    value={selectedDeveloper.kelas}
                    last
                  />
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeDetailButton}
              onPress={() => {
                setModal(null);
                setSelectedDeveloper(null);
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.closeDetailButtonText}>Tutup Profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          MODAL DETAIL DATA SISWA / PRESTASI
      ========================================== */}
      <Modal
        visible={modal === "detail" && detailData !== null}
        animationType="slide"
        transparent
        onRequestClose={tutupDetail}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>
                  {detailType === "siswa" ? "Detail Siswa" : "Detail Prestasi"}
                </Text>
                <Text style={styles.detailModalSubtitle}>
                  Informasi lengkap data
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={tutupDetail}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailScroll}
            >
              {detailType === "siswa" && (
                <>
                  <View style={styles.detailProfile}>
                    <View style={styles.detailAvatar}>
                      <Text style={styles.detailAvatarText}>
                        {detailData.nama?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.detailName}>{detailData.nama}</Text>
                    <View style={styles.detailNisBadge}>
                      <Text style={styles.detailNisText}>
                        NIS {detailData.nis}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailSectionTitle}>
                    Informasi Akademik
                  </Text>
                  <View style={styles.detailInfoCard}>
                    <DetailRow
                      icon="school-outline"
                      label="Kelas"
                      value={detailData.kelas || "-"}
                    />
                    <DetailRow
                      icon="code-slash-outline"
                      label="Jurusan"
                      value={detailData.jurusan || "-"}
                    />
                    <DetailRow
                      icon="ribbon-outline"
                      label="Jumlah Prestasi"
                      value={`${getJumlahPrestasi(
                        detailData.id_siswa,
                      )} prestasi`}
                    />
                  </View>

                  <Text style={styles.detailSectionTitle}>
                    Informasi Pribadi
                  </Text>
                  <View style={styles.detailInfoCard}>
                    <DetailRow
                      icon="person-outline"
                      label="Nama Lengkap"
                      value={detailData.nama || "-"}
                    />
                    <DetailRow
                      icon="card-outline"
                      label="NIS"
                      value={detailData.nis || "-"}
                    />
                    <DetailRow
                      icon="male-female-outline"
                      label="Jenis Kelamin"
                      value={detailData.jenis_kelamin || "-"}
                    />
                    <DetailRow
                      icon="calendar-outline"
                      label="Tanggal Lahir"
                      value={detailData.tanggal_lahir || "-"}
                    />
                    <DetailRow
                      icon="location-outline"
                      label="Alamat"
                      value={detailData.alamat || "-"}
                    />
                  </View>

                  <Text style={styles.detailSectionTitle}>Kontak</Text>
                  <View style={styles.detailInfoCard}>
                    <DetailRow
                      icon="call-outline"
                      label="No. HP"
                      value={detailData.no_hp || "-"}
                    />
                    <DetailRow
                      icon="mail-outline"
                      label="Email"
                      value={detailData.email || "-"}
                      last
                    />
                  </View>

                  <Text style={styles.detailSectionTitle}>Prestasi Siswa</Text>
                  {prestasi.filter((p) => p.id_siswa === detailData.id_siswa)
                    .length === 0 ? (
                    <View style={styles.noPrestasiBox}>
                      <Ionicons
                        name="trophy-outline"
                        size={36}
                        color="#cbd5e1"
                      />
                      <Text style={styles.noPrestasiText}>
                        Siswa ini belum memiliki prestasi.
                      </Text>
                    </View>
                  ) : (
                    prestasi
                      .filter((p) => p.id_siswa === detailData.id_siswa)
                      .map((p) => (
                        <TouchableOpacity
                          key={p.id_prestasi}
                          style={styles.miniPrestasiCard}
                          onPress={() => bukaDetailPrestasi(p)}
                        >
                          <View style={styles.miniPrestasiIcon}>
                            <Ionicons name="ribbon" size={20} color="#d97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.miniPrestasiTitle}>
                              {p.nama_prestasi}
                            </Text>
                            <Text style={styles.miniPrestasiSub}>
                              {p.tingkat || "Tingkat tidak ada"} •{" "}
                              {p.tanggal || "-"}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      ))
                  )}
                </>
              )}

              {detailType === "prestasi" && (
                <>
                  <View style={styles.prestasiDetailHero}>
                    <View style={styles.bigPrestasiIcon}>
                      <Ionicons name="ribbon" size={42} color="#d97706" />
                    </View>
                    <Text style={styles.prestasiDetailTitle}>
                      {detailData.nama_prestasi}
                    </Text>
                    <Text style={styles.prestasiDetailStudent}>
                      {getNamaSiswa(detailData.id_siswa)}
                    </Text>
                  </View>

                  <Text style={styles.detailSectionTitle}>
                    Informasi Prestasi
                  </Text>
                  <View style={styles.detailInfoCard}>
                    <DetailRow
                      icon="trophy-outline"
                      label="Nama Prestasi"
                      value={detailData.nama_prestasi || "-"}
                    />
                    <DetailRow
                      icon="layers-outline"
                      label="Tingkat"
                      value={detailData.tingkat || "-"}
                    />
                    <DetailRow
                      icon="calendar-outline"
                      label="Tanggal"
                      value={detailData.tanggal || "-"}
                    />
                    <DetailRow
                      icon="document-text-outline"
                      label="ID Prestasi"
                      value={String(detailData.id_prestasi || "-")}
                      last
                    />
                  </View>

                  <Text style={styles.detailSectionTitle}>Data Siswa</Text>
                  <View style={styles.detailInfoCard}>
                    <DetailRow
                      icon="person-outline"
                      label="Nama"
                      value={getNamaSiswa(detailData.id_siswa)}
                    />
                    <DetailRow
                      icon="card-outline"
                      label="NIS"
                      value={
                        siswa.find((s) => s.id_siswa === detailData.id_siswa)
                          ?.nis || "-"
                      }
                    />
                    <DetailRow
                      icon="school-outline"
                      label="Kelas"
                      value={
                        siswa.find((s) => s.id_siswa === detailData.id_siswa)
                          ?.kelas || "-"
                      }
                    />
                    <DetailRow
                      icon="code-slash-outline"
                      label="Jurusan"
                      value={
                        siswa.find((s) => s.id_siswa === detailData.id_siswa)
                          ?.jurusan || "-"
                      }
                      last
                    />
                  </View>

                  <Text style={styles.detailSectionTitle}>Deskripsi</Text>
                  <View style={styles.descriptionDetailBox}>
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={24}
                      color="#4338ca"
                    />
                    <Text style={styles.descriptionDetailText}>
                      {detailData.deskripsi ||
                        "Tidak ada deskripsi untuk prestasi ini."}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeDetailButton}
              onPress={tutupDetail}
            >
              <Ionicons name="close-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.closeDetailButtonText}>Tutup Detail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          MODAL FORM SISWA
      ========================================== */}
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
                onPress={() => {
                  setModal(null);
                  setShowGenderDropdown(false);
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
              <InputField
                label="NIS *"
                value={formSiswa.nis}
                placeholder="Contoh: 123456"
                onChangeText={(t) => setFormSiswa({ ...formSiswa, nis: t })}
              />

              <InputField
                label="Nama Lengkap *"
                value={formSiswa.nama}
                placeholder="Masukkan nama lengkap"
                onChangeText={(t) => setFormSiswa({ ...formSiswa, nama: t })}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <InputField
                    label="Kelas *"
                    value={formSiswa.kelas}
                    placeholder="X/XI/XII"
                    onChangeText={(t) =>
                      setFormSiswa({ ...formSiswa, kelas: t })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Jurusan"
                    value={formSiswa.jurusan}
                    placeholder="RPL"
                    onChangeText={(t) =>
                      setFormSiswa({ ...formSiswa, jurusan: t })
                    }
                  />
                </View>
              </View>

              {/* DROPDOWN JENIS KELAMIN */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Jenis Kelamin</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
                  onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                >
                  <Text
                    style={
                      formSiswa.jenis_kelamin
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {formSiswa.jenis_kelamin || "Pilih jenis kelamin..."}
                  </Text>
                  <Ionicons
                    name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {showGenderDropdown && (
                  <View style={styles.dropdownList}>
                    {genderOptions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormSiswa({
                            ...formSiswa,
                            jenis_kelamin: item,
                          });
                          setShowGenderDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* TANGGAL LAHIR DENGAN ICON KALENDER */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal Lahir</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0 }]}
                    value={formSiswa.tanggal_lahir}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#cbd5e1"
                    onChangeText={(t) =>
                      setFormSiswa({ ...formSiswa, tanggal_lahir: t })
                    }
                  />
                  <TouchableOpacity
                    style={styles.calendarIconBtn}
                    onPress={() => handleOpenCalendar("siswa")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color="#4338ca"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <InputField
                label="Alamat"
                value={formSiswa.alamat}
                placeholder="Alamat lengkap"
                multiline
                height={90}
                onChangeText={(t) => setFormSiswa({ ...formSiswa, alamat: t })}
              />

              <InputField
                label="No HP"
                value={formSiswa.no_hp}
                placeholder="08xxxxxxxxxx"
                keyboardType="phone-pad"
                onChangeText={(t) => setFormSiswa({ ...formSiswa, no_hp: t })}
              />

              <InputField
                label="Email"
                value={formSiswa.email}
                placeholder="email@contoh.com"
                keyboardType="email-address"
                onChangeText={(t) => setFormSiswa({ ...formSiswa, email: t })}
              />
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

      {/* ==========================================
          MODAL FORM PRESTASI
      ========================================== */}
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
                  setShowTingkatDropdown(false);
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
              {/* DROPDOWN SISWA */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Siswa *</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
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
                      ? getNamaSiswa(Number(formPrestasi.id_siswa))
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
                      nestedScrollIndicator
                      style={{ maxHeight: 180 }}
                    >
                      {siswa.length === 0 ? (
                        <Text style={styles.dropdownItemText}>
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

              <InputField
                label="Nama Prestasi *"
                value={formPrestasi.nama_prestasi}
                placeholder="Contoh: Juara 1 Lomba Koding"
                onChangeText={(t) =>
                  setFormPrestasi({ ...formPrestasi, nama_prestasi: t })
                }
              />

              {/* DROPDOWN TINGKAT */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tingkat</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
                  onPress={() => setShowTingkatDropdown(!showTingkatDropdown)}
                >
                  <Text
                    style={
                      formPrestasi.tingkat
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {formPrestasi.tingkat || "Pilih tingkat..."}
                  </Text>
                  <Ionicons
                    name={showTingkatDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {showTingkatDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      nestedScrollIndicator
                      style={{ maxHeight: 160 }}
                    >
                      {tingkatOptions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormPrestasi({
                              ...formPrestasi,
                              tingkat: item,
                            });
                            setShowTingkatDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* TANGGAL PRESTASI DENGAN ICON KALENDER */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tanggal</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0 }]}
                    value={formPrestasi.tanggal}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#cbd5e1"
                    onChangeText={(t) =>
                      setFormPrestasi({ ...formPrestasi, tanggal: t })
                    }
                  />
                  <TouchableOpacity
                    style={styles.calendarIconBtn}
                    onPress={() => handleOpenCalendar("prestasi")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color="#4338ca"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <InputField
                label="Deskripsi Singkat"
                value={formPrestasi.deskripsi}
                placeholder="Jelaskan detail prestasi..."
                multiline
                height={100}
                onChangeText={(t) =>
                  setFormPrestasi({ ...formPrestasi, deskripsi: t })
                }
              />
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
// COMPONENT DETAIL ROW & INPUT
// ==========================================

function DetailRow({ icon, label, value, last = false }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <View style={styles.detailRowIcon}>
        <Ionicons name={icon} size={20} color="#4338ca" />
      </View>
      <View style={styles.detailRowContent}>
        <Text style={styles.detailRowLabel}>{label}</Text>
        <Text style={styles.detailRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function InputField({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType,
  multiline = false,
  height = 60,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && { height, textAlignVertical: "top", paddingTop: 16 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 14,
    color: "#64748b",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginTop: 15,
    fontSize: 15,
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#4338ca",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "800",
  },
  scrollPadding: {
    paddingBottom: 110,
    paddingTop: 16,
  },
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
    textAlign: "center",
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
  heroTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
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
    transform: [{ rotate: "-15deg" }],
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 26,
  },
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
  statIconWrap: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
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
  sectionHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
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
    backgroundColor: "#FFFBEB",
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
  recentSub: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  recentActionIndicator: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recentActionText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0f766e",
  },

  // TOOLBAR
  toolbar: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
    marginTop: 4,
  },
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
  searchIcon: {
    marginRight: 12,
  },
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

  // CARD
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "900",
    color: "#4338ca",
    fontSize: 24,
  },
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
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
  },
  cardDetail: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "700",
  },
  prestasiHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 16,
  },
  prestasiIcon: {
    padding: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
  },
  cardSubPrimary: {
    fontSize: 15,
    color: "#4338ca",
    fontWeight: "800",
    marginTop: 4,
  },
  prestasiDetailBox: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  prestasiDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
    flexWrap: "wrap",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnActionList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnDetailText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "800",
  },
  btnEditText: {
    color: "#4338ca",
    fontSize: 14,
    fontWeight: "800",
  },
  btnDeleteText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "800",
  },

  // TEntang
  developerImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#EEF2FF",
  },
  modalDeveloperImageWrap: {
    width: 86,
    height: 86,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#EEF2FF",
    marginBottom: 14,
  },
  developerImage: {
    width: "100%",
    height: "100%",
  },

  // BOTTOM NAV
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
  navText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "800",
    marginTop: 4,
  },
  navTextActive: {
    color: "#4338ca",
  },

  // FORM MODAL
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 20,
  },
  modalScroll: {
    marginBottom: 26,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    height: 60,
    paddingRight: 8,
  },
  calendarIconBtn: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
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
    elevation: 5,
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
    padding: 16,
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
  },
  btnSaveFormText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  // CUSTOM CALENDAR POPUP STYLES
  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarMonthText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  calendarNavBtns: {
    flexDirection: "row",
  },
  calNavBtn: {
    backgroundColor: "#334155",
    padding: 6,
    borderRadius: 10,
  },
  calendarDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarDayLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    width: 36,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calDayBox: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  calDayBoxDisabled: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  calDayBoxSelected: {
    backgroundColor: "#38bdf8",
    borderRadius: 12,
  },
  calDayText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "600",
  },
  calDayTextDisabled: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500",
  },
  calDayTextSelected: {
    color: "#0f172a",
    fontWeight: "900",
  },
  calendarFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 14,
    paddingHorizontal: 10,
  },
  calendarFooterBtnText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "800",
  },

  // DETAIL MODAL
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  detailModal: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: "94%",
    paddingTop: 24,
    overflow: "hidden",
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  detailModalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
  },
  detailModalSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  detailScroll: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  detailProfile: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 26,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  detailAvatar: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  detailAvatarText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#4338ca",
  },
  detailName: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  detailNisBadge: {
    marginTop: 10,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  detailNisText: {
    color: "#4338ca",
    fontWeight: "800",
    fontSize: 12,
  },
  detailSectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
    marginTop: 8,
  },
  detailInfoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  detailRowContent: {
    flex: 1,
  },
  detailRowLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    marginBottom: 3,
  },
  detailRowValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "800",
  },
  noPrestasiBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  noPrestasiText: {
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 10,
    textAlign: "center",
  },
  miniPrestasiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  miniPrestasiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  miniPrestasiTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  miniPrestasiSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  prestasiDetailHero: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 28,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  bigPrestasiIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  prestasiDetailTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  prestasiDetailStudent: {
    fontSize: 15,
    color: "#4338ca",
    fontWeight: "800",
    marginTop: 7,
    textAlign: "center",
  },
  descriptionDetailBox: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  descriptionDetailText: {
    flex: 1,
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "600",
  },
  closeDetailButton: {
    backgroundColor: "#4338ca",
    marginHorizontal: 24,
    marginBottom: 20,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  closeDetailButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});
