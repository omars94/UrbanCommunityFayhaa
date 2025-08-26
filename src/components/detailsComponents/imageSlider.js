import {View, Text, Image, FlatList, StyleSheet, TouchableOpacity, Dimensions, Modal, SafeAreaView, StatusBar} from 'react-native';
import { useState } from 'react';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
const { width, height } = Dimensions.get('window');

const ImageSlider = ({complaint}) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    
    const images = [complaint.photo_url];
    if (complaint.resolved_photo_url) {
        images.push(complaint.resolved_photo_url);
    }
    const validImages = images.filter(img => img);

    if (validImages.length === 0) {
        return null;
    }

    const openImageModal = (index) => {
        setModalImageIndex(index);
        setIsModalVisible(true);
    };

    const closeImageModal = () => {
        setIsModalVisible(false);
    };

    return (
        <View style={styles.imageSliderContainer}>
            <FlatList
                data={validImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentImageIndex(index);
                }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => openImageModal(index)}
                    >
                        <Image 
                            source={{ uri: item }} 
                            style={styles.complaintImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                snapToInterval={width}
                decelerationRate="fast"
                bounces={false}
            />
            
            {validImages.length > 1 && (
                <>
                    <View style={styles.imageIndicators}>
                        {validImages.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.indicator,
                                    index === currentImageIndex && styles.activeIndicator
                                ]}
                            />
                        ))}
                    </View>
                    
                    <View style={styles.imageCounter}>
                        <Text style={styles.counterText}>
                            {currentImageIndex + 1}/{validImages.length}
                        </Text>
                    </View>
                </>
            )}

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImageModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <StatusBar backgroundColor="black" barStyle="light-content" />
                    
                    {/* Close Button */}
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={closeImageModal}
                    >
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={validImages}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => `modal-${index}`}
                        initialScrollIndex={modalImageIndex}
                        getItemLayout={(data, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setModalImageIndex(index);
                        }}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                activeOpacity={1}
                                style={styles.modalImageContainer}
                                onPress={closeImageModal}
                            >
                                <Image 
                                    source={{ uri: item }} 
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                        snapToInterval={width}
                        decelerationRate="fast"
                        bounces={false}
                    />

                    {/* Modal Image Counter */}
                    {validImages.length > 1 && (
                        <View style={styles.modalImageCounter}>
                            <Text style={styles.modalCounterText}>
                                {modalImageIndex + 1} of {validImages.length}
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    imageSliderContainer: {
        position: 'relative',
    },
    complaintImage: {
        width: width,
        height: 250, 
        borderRadius: 8, 
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 3,
    },
    activeIndicator: {
        backgroundColor: 'white',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    imageCounter: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    counterText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalImageContainer: {
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: width,
        height: height * 0.8,
    },
    modalImageCounter: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    modalCounterText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ImageSlider;