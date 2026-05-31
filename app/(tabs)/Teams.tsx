import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { useSoccer } from "@/hooks/useSoccer";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Team } from "@/src/domain/Team";

const SLIDER_WIDTH = Dimensions.get("window").width;
const ITEM_WIDTH = Math.round(SLIDER_WIDTH * 0.7);

interface props {
  imgUrl: string;
  title: string;
  body: string;
}

export default function TeamsScreen() {
  const isCarousel = React.useRef(null);
  const [index, setIndex] = React.useState(0);
  const manager = useSoccer();

  const [teams] = useState(manager.manager.next);

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  const CarouselCardItem = ({
    item,
    index,
  }: {
    index: number;
    // dataIndex: number;
    item: Team;
  }) => {
    return (
      <ThemedView style={stylesItem.container} key={index}>
        {/* <ThemedText style={stylesItem.header}>Time A </ThemedText> */}
        {/* <Image source={{ uri: item.imgUrl }} style={stylesItem.image} /> */}
        <ThemedText style={stylesItem.header}>
          {item.id} - {index}{" "}
        </ThemedText>
        {item.players.map((player) => (
          <ThemedText style={stylesItem.body} key={player.id}>
            {player.name}
          </ThemedText>
        ))}
      </ThemedView>
    );
  };

  const width = Dimensions.get("window").width;

  return (
    <ThemedView>
      <SafeAreaView style={stylesSafe.container}>
        {/* <GestureHandlerRootView style={{ flex: 1 }}> */}
        <Carousel
          ref={ref}
          data={teams}
          renderItem={CarouselCardItem}
          width={SLIDER_WIDTH}
          height={SLIDER_WIDTH + 100}
          onProgressChange={progress}
        />
        <Pagination.Basic
          progress={progress}
          data={teams}
          dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
          containerStyle={{ gap: 5, marginTop: 10 }}
          onPress={onPressPagination}
        />
        {/* </GestureHandlerRootView> */}
        {/* <Pagination
          dotsLength={data.length}
          activeDotIndex={index}
          carouselRef={isCarousel}
          dotStyle={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginHorizontal: 0,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
          }}
          inactiveDotOpacity={0.4}
          inactiveDotScale={0.6}
          tappableDots={true}
        /> */}

        {/* <Pagination.Basic
        progress={progress}
        data={data}
        dotStyle={{ backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 50 }}
        containerStyle={{ gap: 5, marginTop: 10 }}
        onPress={onPressPagination}
      /> */}
      </SafeAreaView>
    </ThemedView>
  );
}

const stylesSafe = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
    padding: 50,
  },
});

const stylesItem = StyleSheet.create({
  container: {
    backgroundColor: "black",
    borderRadius: 8,
    width: ITEM_WIDTH,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
    // justifyContent: "center",
    flex: 1,
  },
  image: {
    width: ITEM_WIDTH,
    height: 300,
  },
  header: {
    color: "#222",
    fontSize: 28,
    fontWeight: "bold",
    paddingLeft: 20,
    paddingTop: 20,
  },
  body: {
    color: "#222",
    fontSize: 18,
    paddingLeft: 20,
    // paddingLeft: 20,
    paddingRight: 20,
  },
});

const data = [
  {
    title: "Aenean leo",
    body: "Ut tincidunt tincidunt erat. Sed cursus turpis vitae tortor. Quisque malesuada placerat nisl. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
    imgUrl: "https://picsum.photos/id/11/200/300",
  },
  {
    title: "In turpis",
    body: "Aenean ut eros et nisl sagittis vestibulum. Donec posuere vulputate arcu. Proin faucibus arcu quis ante. Curabitur at lacus ac velit ornare lobortis. ",
    imgUrl: "https://picsum.photos/id/10/200/300",
  },
  {
    title: "Lorem Ipsum",
    body: "Phasellus ullamcorper ipsum rutrum nunc. Nullam quis ante. Etiam ultricies nisi vel augue. Aenean tellus metus, bibendum sed, posuere ac, mattis non, nunc.",
    imgUrl: "https://picsum.photos/id/12/200/300",
  },
];
