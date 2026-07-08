import { Redirect } from "expo-router";
import { Heart, Moon, Plus, Sun } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

import { Screen } from "@/components/screen";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
  type Option,
} from "@/components/ui";
import { GOVERNORATES } from "@/constants/locale";
import { useColorScheme, useThemeTokens } from "@/theme/theme-provider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-xs font-jakarta-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      <View className="gap-3 rounded-lg border border-border bg-card p-4">{children}</View>
    </View>
  );
}

export default function ThemeGallery() {
  const tokens = useThemeTokens();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState("buy");
  const [gov, setGov] = useState<Option>(undefined);

  // Dev-only QA screen (hooks above must run unconditionally).
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen scroll edges={["bottom"]}>
      <View className="gap-6 p-4">
        {/* Theme toggle */}
        <View className="flex-row items-center justify-between rounded-lg bg-brand p-4">
          <View>
            <Text className="text-base font-jakarta-bold text-brand-foreground">
              Design System
            </Text>
            <Text className="text-xs text-brand-foreground/80">
              Scheme: {colorScheme ?? "light"} (default light · system off)
            </Text>
          </View>
          <Button size="sm" variant="secondary" onPress={toggleColorScheme}>
            <View className="flex-row items-center gap-2">
              {isDark ? (
                <Sun size={16} color={tokens.foreground} />
              ) : (
                <Moon size={16} color={tokens.foreground} />
              )}
              <Text className="text-sm font-jakarta-semibold text-secondary-foreground">
                {isDark ? "Light" : "Dark"}
              </Text>
            </View>
          </Button>
        </View>

        <Section title="Button · variants">
          <View className="flex-row flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="brand">Brand</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </View>
        </Section>

        <Section title="Button · sizes, states & icons">
          <View className="flex-row flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline">
              <Plus size={18} color={tokens.foreground} />
            </Button>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="brand" onPress={() => toast.success("It works!", { description: "sonner-native toast" })}>
              Show toast
            </Button>
          </View>
        </Section>

        <Section title="Badge">
          <View className="flex-row flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="brand">Brand</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Sold</Badge>
            <Badge variant="outline">Outline</Badge>
          </View>
        </Section>

        <Section title="Input & Textarea">
          <View className="gap-1.5">
            <Label>Email</Label>
            <Input placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View className="gap-1.5">
            <Label>Bio</Label>
            <Textarea placeholder="Tell buyers about this property…" />
          </View>
          <Input editable={false} value="Disabled input" />
        </Section>

        <Section title="Card">
          <Card>
            <CardHeader>
              <CardTitle>Al Mouj Villa</CardTitle>
              <CardDescription>Muscat · 4 bed · 5 bath</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-2xl font-jakarta-extrabold text-brand">OMR 450,000</Text>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" variant="brand">
                Contact
              </Button>
              <Button size="sm" variant="outline">
                Save
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section title="Avatar">
          <View className="flex-row items-center gap-3">
            <Avatar alt="With image">
              <AvatarImage source={{ uri: "https://i.pravatar.cc/120?img=12" }} />
              <AvatarFallback>
                <Text className="font-jakarta-semibold text-muted-foreground">PD</Text>
              </AvatarFallback>
            </Avatar>
            <Avatar alt="Fallback only">
              <AvatarFallback>
                <Text className="font-jakarta-semibold text-muted-foreground">QS</Text>
              </AvatarFallback>
            </Avatar>
          </View>
        </Section>

        <Section title="Separator">
          <Text className="text-foreground">Above</Text>
          <Separator />
          <Text className="text-foreground">Below</Text>
        </Section>

        <Section title="Skeleton">
          <View className="gap-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </View>
        </Section>

        <Section title="Tabs">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="rent">Rent</TabsTrigger>
              <TabsTrigger value="invest">Invest</TabsTrigger>
            </TabsList>
            <TabsContent value="buy">
              <Text className="text-muted-foreground">Properties for sale.</Text>
            </TabsContent>
            <TabsContent value="rent">
              <Text className="text-muted-foreground">Rental listings.</Text>
            </TabsContent>
            <TabsContent value="invest">
              <Text className="text-muted-foreground">Investment opportunities.</Text>
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Select">
          <Select value={gov} onValueChange={setGov}>
            <SelectTrigger>
              <SelectValue placeholder="Select a governorate" />
            </SelectTrigger>
            <SelectContent>
              {GOVERNORATES.map((g) => (
                <SelectItem key={g} label={g} value={g} />
              ))}
            </SelectContent>
          </Select>
        </Section>

        <Section title="Checkbox & Switch">
          <View className="flex-row items-center gap-3">
            <Checkbox checked={checked} onCheckedChange={setChecked} />
            <Label onPress={() => setChecked((c) => !c)}>I agree to the terms</Label>
          </View>
          <View className="flex-row items-center justify-between">
            <Label>Email notifications</Label>
            <Switch checked={on} onCheckedChange={setOn} />
          </View>
        </Section>

        <Section title="Dialog & Sheet">
          <View className="flex-row flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete listing?</DialogTitle>
                  <DialogDescription>
                    This permanently removes the property. This can&apos;t be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive">Delete</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="brand">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Refine your property search.</SheetDescription>
                </SheetHeader>
                <View className="mt-4 gap-3">
                  <Button variant="secondary">For Sale</Button>
                  <Button variant="secondary">For Rent</Button>
                  <SheetClose asChild>
                    <Button variant="brand">Apply</Button>
                  </SheetClose>
                </View>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onPress={() => toast("Saved to favorites")}
            >
              <Heart size={18} color={tokens.brand} />
            </Button>
          </View>
        </Section>

        <View className="h-6" />
      </View>
    </Screen>
  );
}
