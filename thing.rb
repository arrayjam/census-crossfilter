require "csv"

main_to_seven = {}
CSV.foreach "SA1_2011_MLjuly2012.csv" do |main, seven|
  next unless main[/^\d+$/]
  main_to_seven[main] = seven
end

sa1_to_ssc = {}
CSV.foreach "sa1_to_ssc.csv" do |main, ssc|
  next unless main[/^\d+$/]
  sa1_to_ssc[main_to_seven[main]] = ssc
end

CSV.open "sa1_to_ssc_converted.csv", "wb" do |csv|
  sa1_to_ssc.each do |main, seven|
    begin
    p seven unless main[/^\d+$/]
    csv << [main, seven]
    rescue
      p seven
    end
  end
end
