class Payments < Lissio::Collection
	model Payment

	adapter Lissio::Adapter::Storage do
		filter do |value, desc|
			if desc
				next false if desc[:name] && value.for.name != desc[:name]
			end

			true
		end
	end
end
